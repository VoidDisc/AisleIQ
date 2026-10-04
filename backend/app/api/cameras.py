from fastapi import APIRouter, HTTPException
from typing import List
from app.schemas.camera import CameraCreate, CameraResponse
from app.services.camera_manager import camera_manager

router = APIRouter(prefix="/api/cameras", tags=["cameras"])

@router.post("", response_model=CameraResponse)
def create_camera(camera: CameraCreate):
    return camera_manager.add_camera(camera)

@router.get("", response_model=List[CameraResponse])
def list_cameras():
    return camera_manager.get_cameras()

@router.get("/{camera_id}", response_model=CameraResponse)
def get_camera(camera_id: str):
    try:
        return camera_manager.get_camera(camera_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Camera not found")

@router.delete("/{camera_id}")
def delete_camera(camera_id: str):
    camera_manager.delete_camera(camera_id)
    return {"status": "deleted"}

@router.post("/{camera_id}/start")
def start_camera(camera_id: str):
    try:
        camera_manager.start_camera(camera_id)
        return {"status": "started"}
    except KeyError:
        raise HTTPException(status_code=404, detail="Camera not found")

@router.post("/{camera_id}/stop")
def stop_camera(camera_id: str):
    camera_manager.stop_camera(camera_id)
    return {"status": "stopped"}

@router.post("/{camera_id}/restart")
def restart_camera(camera_id: str):
    try:
        camera_manager.stop_camera(camera_id)
        camera_manager.start_camera(camera_id)
        return {"status": "restarted"}
    except KeyError:
        raise HTTPException(status_code=404, detail="Camera not found")
