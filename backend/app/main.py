from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.api import cameras, zones, analytics, settings as settings_api, export, stream, alerts, logs, auth
from app.database import engine, Base, SessionLocal
from app.models import models
from app.services.event_manager import event_manager
import logging

# Set up file logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler("aisleiq.log"),
        logging.StreamHandler()
    ]
)

import asyncio
from app.services.camera_manager import camera_manager
from app.services.visit_manager import visit_manager

async def broadcast_loop():
    while True:
        await asyncio.sleep(1)
        if event_manager.active_connections:
            # Broadcast cameras
            cameras_data = [c.model_dump() for c in camera_manager.get_cameras()]
            await event_manager.broadcast("cameras_update", cameras_data)
            
            # Broadcast live tracks for Phase 20 Path Tracing
            all_tracks = {}
            for cam_id, worker in camera_manager.workers.items():
                if hasattr(worker, 'latest_tracks'):
                    all_tracks[cam_id] = worker.latest_tracks
            if all_tracks:
                await event_manager.broadcast("live_tracks", all_tracks)
            
            
            # Broadcast summary from DB
            from app.database import SessionLocal
            from app.models.models import VisitModel
            from sqlalchemy.sql import func
            
            db = SessionLocal()
            try:
                total_visits = db.query(VisitModel).count()
                avg_dwell = db.query(func.avg(VisitModel.duration)).scalar() or 0.0
                
                summary_data = {
                    "total_visits": total_visits,
                    "average_dwell_time": avg_dwell
                }
                await event_manager.broadcast("analytics_summary", summary_data)
            finally:
                db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB Tables
    Base.metadata.create_all(bind=engine)
    
    # Init default users
    db = SessionLocal()
    try:
        from app.api.auth import init_db_users
        init_db_users(db)
    finally:
        db.close()
    # Start broadcast loop
    task = asyncio.create_task(broadcast_loop())
    yield
    task.cancel()

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
app.include_router(settings_api.router)
app.include_router(export.router)
app.include_router(stream.router)
app.include_router(alerts.router)
app.include_router(logs.router)
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])

@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await event_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive, wait for client disconnect
            await websocket.receive_text()
    except WebSocketDisconnect:
        event_manager.disconnect(websocket)

from fastapi.responses import FileResponse
import os

@app.get("/api/clips/{clip_name}")
def get_clip(clip_name: str):
    filepath = f"data/clips/{clip_name}"
    if not os.path.exists(filepath):
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Clip not found")
    return FileResponse(filepath, media_type="video/mp4")
