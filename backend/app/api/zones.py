from fastapi import APIRouter, HTTPException
from typing import List
import uuid
from app.schemas.zone import ZoneCreate, ZoneResponse, ZoneUpdate
from app.services.zone_engine import zone_engine

router = APIRouter(tags=["zones"])

@router.post("/api/cameras/{camera_id}/zones", response_model=ZoneResponse)
def create_zone(camera_id: str, zone: ZoneCreate):
    if zone.camera_id != camera_id:
        raise HTTPException(status_code=400, detail="Camera ID mismatch")
        
    zone_response = ZoneResponse(
        id=str(uuid.uuid4()),
        **zone.model_dump()
    )
    zone_engine.add_zone(zone_response)
    return zone_response

@router.get("/api/cameras/{camera_id}/zones", response_model=List[ZoneResponse])
def get_zones(camera_id: str):
    return zone_engine.get_zones_for_camera(camera_id)

@router.delete("/api/zones/{zone_id}")
def delete_zone(zone_id: str, camera_id: str):
    # In a real database, we'd lookup the camera_id from the zone_id.
    # For now, require it as a query param or handle gracefully.
    zone_engine.remove_zone(camera_id, zone_id)
    return {"status": "deleted"}
