"""
Session storage — reads/writes analysis session data to Firestore.
Falls back to in-memory dict when Firestore is not configured (DEV_MODE).
"""
import logging
import uuid
from datetime import datetime
from typing import Optional
from firebase_admin_setup import get_db

logger = logging.getLogger(__name__)

# In-memory fallback store (used in DEV_MODE or if Firestore unavailable)
_memory_store: dict[str, dict] = {}


def new_session_id() -> str:
    return uuid.uuid4().hex[:12]


def _firestore_path(uid: str, session_id: str):
    """Returns the Firestore document reference for a session."""
    db = get_db()
    if db is None:
        return None
    return db.collection("users").document(uid).collection("sessions").document(session_id)


# ─── CREATE ────────────────────────────────────────────────────────────────────

def create_session(uid: str, session_id: str, filename: str, file_path: str) -> dict:
    """Create a new session record."""
    session = {
        "session_id": session_id,
        "uid": uid,
        "filename": filename,
        "file_path": file_path,
        "status": "running",
        "steps": {s: {"status": "pending", "data": {}} for s in [
            "upload", "analyze", "task", "preprocess",
            "recommend", "train", "evaluate", "shap", "viz"
        ]},
        "ai_insight": "",
        "created_at": datetime.utcnow().isoformat(),
    }

    ref = _firestore_path(uid, session_id)
    if ref:
        try:
            ref.set(session)
        except Exception as e:
            logger.warning(f"Firestore write failed, using memory: {e}")
            _memory_store[session_id] = session
    else:
        _memory_store[session_id] = session

    return session


# ─── UPDATE ────────────────────────────────────────────────────────────────────

def update_step(uid: str, session_id: str, step_id: str, status: str, data: dict):
    """Update a single step's status and data."""
    step_payload = {"status": status, "data": data}

    ref = _firestore_path(uid, session_id)
    if ref:
        try:
            ref.update({f"steps.{step_id}": step_payload})
            return
        except Exception as e:
            logger.warning(f"Firestore step update failed: {e}")

    # Memory fallback
    if session_id in _memory_store:
        _memory_store[session_id]["steps"][step_id] = step_payload


def mark_session_done(uid: str, session_id: str, ai_insight: str = ""):
    """Mark session as completed."""
    ref = _firestore_path(uid, session_id)
    if ref:
        try:
            ref.update({"status": "done", "ai_insight": ai_insight})
            return
        except Exception as e:
            logger.warning(f"Firestore session done update failed: {e}")

    if session_id in _memory_store:
        _memory_store[session_id]["status"] = "done"
        _memory_store[session_id]["ai_insight"] = ai_insight


def mark_session_error(uid: str, session_id: str, error: str):
    """Mark session as failed."""
    ref = _firestore_path(uid, session_id)
    if ref:
        try:
            ref.update({"status": "error", "error": error})
            return
        except Exception as e:
            logger.warning(f"Firestore error update failed: {e}")

    if session_id in _memory_store:
        _memory_store[session_id]["status"] = "error"


# ─── READ ──────────────────────────────────────────────────────────────────────

def get_session(uid: str, session_id: str) -> Optional[dict]:
    """Get a session by ID."""
    ref = _firestore_path(uid, session_id)
    if ref:
        try:
            doc = ref.get()
            if doc.exists:
                return doc.to_dict()
        except Exception as e:
            logger.warning(f"Firestore get failed: {e}")

    return _memory_store.get(session_id)


def list_sessions(uid: str) -> list[dict]:
    """List all sessions for a user, newest first."""
    db = get_db()
    if db:
        try:
            docs = (
                db.collection("users")
                .document(uid)
                .collection("sessions")
                .order_by("created_at", direction="DESCENDING")
                .limit(50)
                .stream()
            )
            return [d.to_dict() for d in docs]
        except Exception as e:
            logger.warning(f"Firestore list failed: {e}")

    # Memory fallback
    return sorted(
        [s for s in _memory_store.values() if s.get("uid") == uid],
        key=lambda x: x.get("created_at", ""),
        reverse=True,
    )


def delete_session(uid: str, session_id: str):
    """Delete a session."""
    ref = _firestore_path(uid, session_id)
    if ref:
        try:
            ref.delete()
        except Exception as e:
            logger.warning(f"Firestore delete failed: {e}")

    _memory_store.pop(session_id, None)


# ─── CHAT HISTORY ──────────────────────────────────────────────────────────────

def append_chat(uid: str, session_id: str, role: str, text: str):
    """Append a chat message to the session's chat history in Firestore."""
    db = get_db()
    if db:
        try:
            db.collection("users").document(uid)\
              .collection("sessions").document(session_id)\
              .collection("chat_history").add({
                  "role": role,
                  "text": text,
                  "timestamp": datetime.utcnow().isoformat()
              })
        except Exception as e:
            logger.warning(f"Firestore chat append failed: {e}")


def get_chat_history(uid: str, session_id: str) -> list[dict]:
    """Get all chat messages for a session."""
    db = get_db()
    if db:
        try:
            docs = (
                db.collection("users").document(uid)
                .collection("sessions").document(session_id)
                .collection("chat_history")
                .order_by("timestamp")
                .stream()
            )
            return [d.to_dict() for d in docs]
        except Exception as e:
            logger.warning(f"Firestore chat get failed: {e}")

    return []
