from fastapi import APIRouter, Depends
from app.api.auth import get_current_admin
from app.services.visit_manager import visit_manager

router = APIRouter(tags=["security"])

@router.get("/api/security/status")
def get_security_status():
    return {"armed": visit_manager.is_armed}

@router.post("/api/security/arm")
def arm_system(current_user = Depends(get_current_admin)):
    visit_manager.is_armed = True
    return {"status": "success", "armed": True}

@router.post("/api/security/disarm")
def disarm_system(current_user = Depends(get_current_admin)):
    visit_manager.is_armed = False
    return {"status": "success", "armed": False}
