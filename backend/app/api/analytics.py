from fastapi import APIRouter, Depends
from typing import List
from app.schemas.visit import VisitSession
from app.services.visit_manager import visit_manager
from app.api.auth import get_current_user
from app.models.models import UserModel

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/visits", response_model=List[VisitSession])
def get_visits(current_user: UserModel = Depends(get_current_user)):
    return visit_manager.history

@router.get("/summary")
def get_summary(hours: int = None, current_user: UserModel = Depends(get_current_user)):
    from app.database import SessionLocal
    from app.models.models import VisitModel, TransactionModel
    from sqlalchemy.sql import func
    from datetime import datetime, timedelta
    
    db = SessionLocal()
    try:
        query = db.query(VisitModel)
        if hours:
            cutoff = datetime.utcnow() - timedelta(hours=hours)
            query = query.filter(VisitModel.entry_time >= cutoff)
            
        total_visits = query.count()
        avg_dwell = db.query(func.avg(VisitModel.duration)).filter(VisitModel.id.in_([v.id for v in query.all()])).scalar() if hours else db.query(func.avg(VisitModel.duration)).scalar()
        
        # Calculate business metrics (Phase 26)
        tx_query = db.query(func.count(TransactionModel.id).label("tx_count"), func.sum(TransactionModel.amount).label("revenue"))
        if hours:
            tx_query = tx_query.filter(TransactionModel.timestamp >= cutoff)
        
        tx_stats = tx_query.first()
        tx_count = tx_stats.tx_count if tx_stats and tx_stats.tx_count else 0
        revenue = tx_stats.revenue if tx_stats and tx_stats.revenue else 0.0
        conversion = round((tx_count / total_visits * 100) if total_visits > 0 else 0, 1)

        return {
            "total_visits": total_visits,
            "average_dwell_time": avg_dwell or 0.0,
            "transactions": tx_count,
            "revenue": revenue,
            "conversion_rate": conversion
        }
    finally:
        db.close()

@router.get("/history")
def get_history(hours: int = None, current_user: UserModel = Depends(get_current_user)):
    from app.database import SessionLocal
    from app.models.models import VisitModel
    from sqlalchemy.sql import func
    from datetime import datetime, timedelta
    
    db = SessionLocal()
    try:
        query = db.query(
            VisitModel.zone_id,
            func.count(VisitModel.id).label("visits"),
            func.avg(VisitModel.duration).label("avg_dwell_time")
        )
        
        if hours:
            cutoff = datetime.utcnow() - timedelta(hours=hours)
            query = query.filter(VisitModel.entry_time >= cutoff)
            
        stats = query.group_by(VisitModel.zone_id).all()
        
        result = [
            {
                "zone_id": row.zone_id,
                "visits": row.visits,
                "avg_dwell_time": row.avg_dwell_time or 0.0
            }
            for row in stats if row.zone_id is not None
        ]
        
        # If empty, return some placeholder data for demo
        if not result:
            return [
                {"zone_id": "Produce", "visits": 120, "avg_dwell_time": 45},
                {"zone_id": "Dairy", "visits": 80, "avg_dwell_time": 20},
                {"zone_id": "Bakery", "visits": 150, "avg_dwell_time": 60},
            ]
            
        return result
    finally:
        db.close()
