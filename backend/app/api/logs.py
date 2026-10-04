from fastapi import APIRouter, Depends
import os
from app.api.auth import get_current_admin
from app.models.models import UserModel

router = APIRouter(prefix="/api/logs", tags=["logs"])

@router.get("/")
def get_recent_logs(lines: int = 100, current_user: UserModel = Depends(get_current_admin)):
    log_file = "aisleiq.log"
    if not os.path.exists(log_file):
        return {"logs": ["Log file not found."]}
        
    with open(log_file, "r") as f:
        all_lines = f.readlines()
        return {"logs": all_lines[-lines:]}
