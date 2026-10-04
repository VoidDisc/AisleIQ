from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.api import cameras, zones, analytics
from app.database import engine, Base
from app.models import models
from app.services.event_manager import event_manager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB Tables
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(title=settings.project_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local dev prototype
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "project": settings.project_name}

app.include_router(cameras.router)
app.include_router(zones.router)
app.include_router(analytics.router)

@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await event_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive, wait for client disconnect
            await websocket.receive_text()
    except WebSocketDisconnect:
        event_manager.disconnect(websocket)
