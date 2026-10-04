from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class SourceType(str, Enum):
    LOCAL = "local"
    RTSP = "rtsp"
    SYNTHETIC = "synthetic"

class CameraStatus(str, Enum):
    STOPPED = "stopped"
    STARTING = "starting"
    RUNNING = "running"
    ERROR = "error"
    DISCONNECTED = "disconnected"

class CameraBase(BaseModel):
    name: str = Field(..., example="Front Door")
    source_type: SourceType
    source_path: str = Field(..., example="video.mp4")
    repeat: bool = True

class CameraCreate(CameraBase):
    pass

class CameraResponse(CameraBase):
    id: str
    enabled: bool = True
    status: CameraStatus = CameraStatus.STOPPED
    processing_fps: float = 0.0
    last_error: Optional[str] = None
    created_at: datetime
    last_seen_at: Optional[datetime] = None

class CameraUpdate(BaseModel):
    name: Optional[str] = None
    source_type: Optional[SourceType] = None
    source_path: Optional[str] = None
    enabled: Optional[bool] = None
    repeat: Optional[bool] = None
