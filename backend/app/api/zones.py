from fastapi import APIRouter, HTTPException, Depends
from typing import List
import uuid
import json
from app.schemas.zone import ZoneCreate, ZoneResponse, ZoneUpdate
from app.services.zone_engine import zone_engine
from app.database import SessionLocal
from app.models.models import ZoneModel, UserModel
from app.api.auth import get_current_user, get_current_admin

router = APIRouter(tags=["zones"])

@router.post("/api/cameras/{camera_id}/zones", response_model=ZoneResponse)
def create_zone(camera_id: str, zone: ZoneCreate, current_user: UserModel = Depends(get_current_admin)):
    if zone.camera_id != camera_id:
        raise HTTPException(status_code=400, detail="Camera ID mismatch")
        
    zone_id = str(uuid.uuid4())
    zone_response = ZoneResponse(
        id=zone_id,
        **zone.model_dump()
    )
    
    # Save to database
    db = SessionLocal()
    try:
        db_zone = ZoneModel(
            id=zone_id,
            camera_id=camera_id,
            name=zone.name,
            polygon_json=json.dumps(zone.polygon),
            color=zone.color,
            enabled=zone.enabled
        )
        db.add(db_zone)
        db.commit()
    finally:
        db.close()
        
    # Add to running engine
    zone_engine.add_zone(zone_response)
    return zone_response

@router.get("/api/cameras/{camera_id}/zones", response_model=List[ZoneResponse])
def get_zones(camera_id: str, current_user: UserModel = Depends(get_current_user)):
    db = SessionLocal()
    try:
        zones = db.query(ZoneModel).filter(ZoneModel.camera_id == camera_id).all()
        # Convert DB models to schema response
        result = []
        for z in zones:
            polygon = json.loads(z.polygon_json) if z.polygon_json else []
            result.append(ZoneResponse(
                id=z.id,
                camera_id=z.camera_id,
                name=z.name,
                polygon=polygon,
                color=z.color,
                enabled=z.enabled
            ))
        return result
    finally:
        db.close()

@router.delete("/api/zones/{zone_id}")
def delete_zone(zone_id: str, camera_id: str, current_user: UserModel = Depends(get_current_admin)):
    db = SessionLocal()
    try:
        db_zone = db.query(ZoneModel).filter(ZoneModel.id == zone_id).first()
        if db_zone:
            db.delete(db_zone)
            db.commit()
    finally:
        db.close()
        
    zone_engine.remove_zone(camera_id, zone_id)
    return {"status": "deleted"}

@router.put("/api/zones/{zone_id}", response_model=ZoneResponse)
def update_zone(zone_id: str, zone_update: ZoneUpdate, current_user: UserModel = Depends(get_current_admin)):
    db = SessionLocal()
    try:
        db_zone = db.query(ZoneModel).filter(ZoneModel.id == zone_id).first()
        if not db_zone:
            raise HTTPException(status_code=404, detail="Zone not found")
            
        if zone_update.name is not None:
            db_zone.name = zone_update.name
        if zone_update.polygon is not None:
            db_zone.polygon_json = json.dumps(zone_update.polygon)
        if zone_update.color is not None:
            db_zone.color = zone_update.color
        if zone_update.enabled is not None:
            db_zone.enabled = zone_update.enabled
            
        db.commit()
        db.refresh(db_zone)
        
        updated_response = ZoneResponse(
            id=db_zone.id,
            camera_id=db_zone.camera_id,
            name=db_zone.name,
            polygon=json.loads(db_zone.polygon_json),
            color=db_zone.color,
            enabled=db_zone.enabled
        )
        zone_engine.add_zone(updated_response) # overwrite existing
        return updated_response
    finally:
        db.close()
