"""
DataCopilot FastAPI Backend — Main Application
Endpoints: upload, upload-demo, session CRUD, chat, WebSocket pipeline
"""
import os
import asyncio
import logging
import queue
import threading
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
load_dotenv()

# ── LOGGING ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s"
)
# Silence SHAP's extremely verbose internal logs
logging.getLogger("shap").setLevel(logging.WARNING)
logging.getLogger("shap.explainers").setLevel(logging.WARNING)

logger = logging.getLogger(__name__)


from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from firebase_admin_setup import init_firebase
from auth_middleware import get_current_user, get_current_user_ws
from session_store import (
    new_session_id, create_session, update_step,
    mark_session_done, mark_session_error,
    get_session, list_sessions, delete_session,
    append_chat, get_chat_history,
)
from data_provider import get_demo_path, list_demos
from automl import run_pipeline
from chat_agent import get_chat_response, generate_shap_insight

# ── LOGGING ────────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)

# ── WORKSPACE ─────────────────────────────────────────────────────────────────
WORKSPACE = Path(__file__).parent / "workspace" / "uploads"
WORKSPACE.mkdir(parents=True, exist_ok=True)

# ── APP ────────────────────────────────────────────────────────────────────────
app = FastAPI(title="DataCopilot AutoML API", version="1.0.0")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── STARTUP ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    init_firebase()
    logger.info("DataCopilot backend started.")


# ── HEALTH CHECK ──────────────────────────────────────────────────────────────
@app.get("/")
def health():
    return {"status": "ACTIVE", "message": "DataCopilot AutoML API is running"}


# ── DEMO DATASETS LIST ────────────────────────────────────────────────────────
@app.get("/api/demos")
def get_demos():
    return list_demos()


# ── UPLOAD REAL FILE ──────────────────────────────────────────────────────────
@app.post("/api/upload")
async def upload_file(
    file: UploadFile = File(...),
    uid: str = Depends(get_current_user),
):
    ext = Path(file.filename).suffix.lower()
    if ext not in (".csv", ".json"):
        raise HTTPException(400, "Only .csv and .json files are supported.")

    session_id = new_session_id()
    file_path = WORKSPACE / f"{session_id}{ext}"

    # Save the uploaded file
    content = await file.read()
    file_path.write_bytes(content)

    # Create session record
    create_session(uid, session_id, file.filename, str(file_path))

    logger.info(f"Uploaded '{file.filename}' for user {uid} → session {session_id}")
    return {"session_id": session_id, "filename": file.filename}


# ── UPLOAD DEMO DATASET ───────────────────────────────────────────────────────
class DemoRequest(BaseModel):
    demo_id: str

@app.post("/api/upload-demo")
async def upload_demo(
    body: DemoRequest,
    uid: str = Depends(get_current_user),
):
    try:
        demo_path = get_demo_path(body.demo_id)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except RuntimeError as e:
        raise HTTPException(503, str(e))

    session_id = new_session_id()
    create_session(uid, session_id, demo_path.name, str(demo_path))

    logger.info(f"Demo '{body.demo_id}' selected for user {uid} → session {session_id}")
    return {"session_id": session_id, "filename": demo_path.name}


# ── GET SESSION ───────────────────────────────────────────────────────────────
@app.get("/api/session/{session_id}")
def get_session_data(
    session_id: str,
    uid: str = Depends(get_current_user),
):
    session = get_session(uid, session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    return session


# ── LIST SESSIONS ─────────────────────────────────────────────────────────────
@app.get("/api/sessions")
def get_user_sessions(uid: str = Depends(get_current_user)):
    sessions = list_sessions(uid)
    # Return lightweight summary (no full step data)
    return [
        {
            "session_id": s.get("session_id"),
            "filename": s.get("filename"),
            "status": s.get("status"),
            "created_at": s.get("created_at"),
            "best_model": s.get("steps", {}).get("evaluate", {}).get("data", {}).get("best_model"),
            "best_accuracy": next(
                (m.get("accuracy") for m in s.get("steps", {}).get("evaluate", {}).get("data", {}).get("metrics", []) if m.get("is_best")),
                None
            ),
        }
        for s in sessions
    ]


# ── DELETE SESSION ────────────────────────────────────────────────────────────
@app.delete("/api/session/{session_id}")
def remove_session(
    session_id: str,
    uid: str = Depends(get_current_user),
):
    session = get_session(uid, session_id)
    if not session:
        raise HTTPException(404, "Session not found")

    # Delete uploaded file if it's in our workspace (not a demo)
    file_path = Path(session.get("file_path", ""))
    if file_path.exists() and str(WORKSPACE) in str(file_path):
        file_path.unlink(missing_ok=True)

    delete_session(uid, session_id)
    return {"deleted": session_id}


# ── CHAT ──────────────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    session_id: str
    message: str

@app.post("/api/chat")
async def chat(
    body: ChatRequest,
    uid: str = Depends(get_current_user),
):
    session = get_session(uid, body.session_id)
    if not session:
        raise HTTPException(404, "Session not found")

    # Save user message
    append_chat(uid, body.session_id, "user", body.message)

    # Get AI response (runs in thread pool to avoid blocking)
    loop = asyncio.get_event_loop()
    reply = await loop.run_in_executor(None, get_chat_response, session, body.message)

    # Save AI response
    append_chat(uid, body.session_id, "ai", reply)

    return {"reply": reply}


# ── GET CHAT HISTORY ──────────────────────────────────────────────────────────
@app.get("/api/chat/{session_id}/history")
def get_history(
    session_id: str,
    uid: str = Depends(get_current_user),
):
    return get_chat_history(uid, session_id)


# ── WEBSOCKET: PIPELINE STREAMING ────────────────────────────────────────────
@app.websocket("/ws/analysis/{session_id}")
async def analysis_websocket(
    websocket: WebSocket,
    session_id: str,
    token: Optional[str] = None,
):
    await websocket.accept()

    # Authenticate
    try:
        uid = await get_current_user_ws(token)
    except HTTPException as e:
        await websocket.send_json({"error": e.detail})
        await websocket.close(code=1008)
        return

    # Load session to get file path
    session = get_session(uid, session_id)
    if not session:
        await websocket.send_json({"error": "Session not found"})
        await websocket.close(code=1008)
        return

    file_path = session.get("file_path")
    if not file_path or not Path(file_path).exists():
        await websocket.send_json({"error": "Dataset file not found on server"})
        await websocket.close(code=1011)
        return

    logger.info(f"WS pipeline started: session={session_id} uid={uid}")

    # Thread-safe queue for pipeline events
    event_queue: queue.Queue = queue.Queue()

    def run_pipeline_thread():
        """Runs the AutoML pipeline in a background thread."""
        try:
            for step_event in run_pipeline(file_path):
                event_queue.put(step_event)
        except Exception as e:
            logger.error(f"Pipeline error for session {session_id}: {e}")
            event_queue.put({"step": "error", "status": "error", "data": {"error": str(e)}, "elapsed": 0})
        finally:
            event_queue.put(None)  # Sentinel: pipeline finished

    thread = threading.Thread(target=run_pipeline_thread, daemon=True)
    thread.start()

    # Stream events from the queue to the WebSocket
    try:
        while True:
            try:
                # Non-blocking check every 50ms so we can handle disconnect
                event = event_queue.get_nowait()
            except queue.Empty:
                await asyncio.sleep(0.05)
                continue

            if event is None:
                # Pipeline finished
                break

            # Forward event to frontend
            try:
                await websocket.send_json(event)
            except (WebSocketDisconnect, RuntimeError):
                logger.info(f"Client disconnected from session {session_id}")
                break

            # Persist step data to Firestore on each "done" event
            if event.get("status") == "done":
                step_id = event.get("step")
                data = event.get("data", {})
                update_step(uid, session_id, step_id, "done", data)

            elif event.get("status") == "error":
                step_id = event.get("step")
                data = event.get("data", {})
                update_step(uid, session_id, step_id, "error", data)
                mark_session_error(uid, session_id, data.get("error", "Unknown error"))
                break

        # Generate AI insight and mark session complete
        updated_session = get_session(uid, session_id)
        if updated_session:
            loop = asyncio.get_event_loop()
            ai_insight = await loop.run_in_executor(None, generate_shap_insight, updated_session)
            mark_session_done(uid, session_id, ai_insight)
            try:
                await websocket.send_json({
                    "step": "complete",
                    "status": "done",
                    "data": {"ai_insight": ai_insight},
                    "elapsed": event.get("elapsed", 0) if event else 0,
                })
            except (WebSocketDisconnect, RuntimeError):
                pass

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for session {session_id}")
    except Exception as e:
        logger.error(f"WebSocket error for session {session_id}: {e}")
    finally:
        # Delete the dataset file to save space (no longer needed once results are in Firestore)
        try:
            p = Path(file_path)
            if p.exists() and p.is_file():
                p.unlink()
                logger.info(f"Cleaned up temporary dataset file: {file_path}")
        except Exception as cleanup_err:
            logger.warning(f"Failed to clean up file {file_path}: {cleanup_err}")

        logger.info(f"WS pipeline completed: session={session_id}")


# ── ENTRY POINT ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
