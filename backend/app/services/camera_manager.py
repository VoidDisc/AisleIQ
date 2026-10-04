import uuid
from typing import Dict, List
from datetime import datetime
from app.schemas.camera import CameraCreate, CameraResponse, CameraStatus, SourceType
from app.workers.camera_worker import CameraWorker

class CameraManager:
    def __init__(self):
        # In-memory store for Phase 2 prototype (will move to DB later)
        self.cameras: Dict[str, dict] = {}
        self.workers: Dict[str, CameraWorker] = {}

    def add_camera(self, config: CameraCreate) -> CameraResponse:
        camera_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        cam_data = {
            "id": camera_id,
            "name": config.name,
            "source_type": config.source_type,
            "source_path": config.source_path,
            "repeat": config.repeat,
            "enabled": True,
            "status": CameraStatus.STOPPED,
            "processing_fps": 0.0,
            "active_tracks": 0,
            "last_error": None,
            "created_at": now,
            "last_seen_at": None,
        }
        self.cameras[camera_id] = cam_data
        return CameraResponse(**cam_data)

    def get_cameras(self) -> List[CameraResponse]:
        result = []
        for cam_id, data in self.cameras.items():
            # Update status from worker if exists
            if cam_id in self.workers:
                worker = self.workers[cam_id]
                data["status"] = CameraStatus(worker.status)
                data["processing_fps"] = worker.processing_fps
                data["active_tracks"] = worker.active_tracks_count
                data["last_error"] = worker.last_error
            result.append(CameraResponse(**data))
        return result

    def get_camera(self, camera_id: str) -> CameraResponse:
        if camera_id not in self.cameras:
            raise KeyError("Camera not found")
            
        data = self.cameras[camera_id]
        if camera_id in self.workers:
            worker = self.workers[camera_id]
            data["status"] = CameraStatus(worker.status)
            data["processing_fps"] = worker.processing_fps
            data["active_tracks"] = worker.active_tracks_count
            data["last_error"] = worker.last_error
            
        return CameraResponse(**data)

    def start_camera(self, camera_id: str):
        if camera_id not in self.cameras:
            raise KeyError("Camera not found")
            
        cam_data = self.cameras[camera_id]
        
        # Prevent duplicates
        if camera_id in self.workers:
            worker = self.workers[camera_id]
            if worker.status in ["running", "starting"]:
                return  # Already running
            else:
                worker.stop()
                
        # Start new worker
        worker = CameraWorker(
            camera_id=camera_id, 
            source_path=cam_data["source_path"],
            repeat=cam_data.get("repeat", True)
        )
        self.workers[camera_id] = worker
        worker.start()

    def stop_camera(self, camera_id: str):
        if camera_id in self.workers:
            self.workers[camera_id].stop()

    def delete_camera(self, camera_id: str):
        if camera_id in self.workers:
            self.workers[camera_id].stop()
            del self.workers[camera_id]
        
        if camera_id in self.cameras:
            del self.cameras[camera_id]

camera_manager = CameraManager()
