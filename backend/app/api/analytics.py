from fastapi import APIRouter
from typing import List
from app.schemas.visit import VisitSession
from app.services.visit_manager import visit_manager

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/visits", response_model=List[VisitSession])
def get_visits():
    return visit_manager.history

@router.get("/summary")
def get_summary():
    visits = visit_manager.history
    total_visits = len(visits)
    avg_dwell_time = sum(v.duration for v in visits) / total_visits if total_visits > 0 else 0
    
    return {
        "total_visits": total_visits,
        "average_dwell_time": avg_dwell_time
    }
