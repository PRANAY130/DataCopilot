from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import asyncio

app = FastAPI(title="AI Data Science Copilot API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ACTIVE", "message": "Neural Interface Backend Uplink Established"}

@app.websocket("/ws/analysis")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    # Mocking real-time step reflection for now
    steps = [
        "Analyzing dataset structure...",
        "Identifying numerical and categorical features...",
        "Detecting task: Classification detected.",
        "Imputing missing values with median...",
        "Encoding categorical variables...",
        "Training XGBoost Model...",
        "Generating SHAP feature importance..."
    ]
    try:
        for step in steps:
            await asyncio.sleep(2)  # Simulate processing time
            await websocket.send_json({"step": step, "status": "processing"})
        await websocket.send_json({"step": "Analysis Complete.", "status": "done"})
    except Exception as e:
        print(f"WebSocket Error: {e}")
    finally:
        await websocket.close()

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
