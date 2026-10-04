from fastapi import APIRouter
from pydantic import BaseModel
from app.config import settings

router = APIRouter(prefix="/api/settings", tags=["settings"])

class SettingsUpdate(BaseModel):
    confidence_threshold: float
    max_fps: int
    track_loss_timeout: float
    min_visit_duration: float

@router.get("/")
def get_settings():
    return {
        "confidence_threshold": settings.confidence_threshold,
        "max_fps": settings.max_fps,
        "track_loss_timeout": settings.track_loss_timeout,
        "min_visit_duration": settings.min_visit_duration
    }

@router.put("/")
def update_settings(new_settings: SettingsUpdate):
    # In a real app, we'd save these to a database or environment file
    # For now, we update the in-memory settings singleton
    settings.confidence_threshold = new_settings.confidence_threshold
    settings.max_fps = new_settings.max_fps
    settings.track_loss_timeout = new_settings.track_loss_timeout
    settings.min_visit_duration = new_settings.min_visit_duration
    
    return get_settings()
