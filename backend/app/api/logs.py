from fastapi import APIRouter
import os

router = APIRouter(prefix="/api/logs", tags=["logs"])

@router.get("/")
def get_recent_logs(lines: int = 100):
    log_file = "aisleiq.log"
    if not os.path.exists(log_file):
        return {"logs": ["Log file not found."]}
        
    with open(log_file, "r") as f:
        all_lines = f.readlines()
        return {"logs": all_lines[-lines:]}
