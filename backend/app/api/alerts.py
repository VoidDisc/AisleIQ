from fastapi import APIRouter, Depends
from app.database import SessionLocal
from app.models.models import AlertModel, UserModel
from app.api.auth import get_current_user, get_current_admin

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

@router.get("/")
def get_recent_alerts(limit: int = 20, current_user: UserModel = Depends(get_current_user)):
    db = SessionLocal()
    try:
        alerts = db.query(AlertModel).filter_by(resolved=False).order_by(AlertModel.timestamp.desc()).limit(limit).all()
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

@router.put("/{alert_id}/resolve")
def resolve_alert(alert_id: int, current_user: UserModel = Depends(get_current_admin)):
    db = SessionLocal()
    try:
        alert = db.query(AlertModel).filter(AlertModel.id == alert_id).first()
        if alert:
            alert.resolved = True
            db.commit()
            return {"status": "success"}
        return {"status": "not_found"}
    finally:
        db.close()
