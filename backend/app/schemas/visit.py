from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class VisitSession(BaseModel):
    id: str
    camera_id: str
    zone_id: str
    track_id: int
    entry_time: datetime
    exit_time: Optional[datetime] = None
    duration: float = 0.0 # In seconds
    status: str = "active" # active, completed, interrupted
