from pydantic import BaseModel
from typing import List, Tuple, Optional

class ZoneBase(BaseModel):
    name: str
    camera_id: str
    polygon: List[Tuple[float, float]] # List of (x, y) coordinates normalized [0, 1]
    color: Optional[str] = "#8B5CF6"
    enabled: bool = True

class ZoneCreate(ZoneBase):
    pass

class ZoneResponse(ZoneBase):
    id: str

class ZoneUpdate(BaseModel):
    name: Optional[str] = None
    polygon: Optional[List[Tuple[float, float]]] = None
    color: Optional[str] = None
    enabled: Optional[bool] = None
