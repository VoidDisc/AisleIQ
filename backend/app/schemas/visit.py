from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class VisitSession(BaseModel):
    id: str
    camera_id: str
    zone_id: Optional[str] = None
    track_id: int
    entry_time: datetime
    exit_time: Optional[datetime] = None
    duration: float = 0.0 # In seconds
    status: str = "active" # active, completed, interrupted
    dominant_color: Optional[str] = None
    path: List[List[float]] = Field(default_factory=list) # List of [x, y] coordinates
