from fastapi import APIRouter
from app.database import SessionLocal
from app.models.models import AlertModel

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

@router.get("/")
def get_recent_alerts(limit: int = 20):
    db = SessionLocal()
    try:
        alerts = db.query(AlertModel).order_by(AlertModel.timestamp.desc()).limit(limit).all()
        return [
            {
                "id": a.id,
                "type": a.type,
                "message": a.message,
                "zone_id": a.zone_id,
                "timestamp": a.timestamp.isoformat(),
                "resolved": a.resolved
            }
            for a in alerts
        ]
    finally:
        db.close()
