import csv
from io import StringIO
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.api.auth import get_current_admin
from app.models.models import UserModel
from app.database import SessionLocal
from app.models.models import VisitModel

router = APIRouter(prefix="/api/export", tags=["export"])

@router.get("/visits.csv")
def export_visits_csv(current_user: UserModel = Depends(get_current_admin)):
    db = SessionLocal()
    try:
        visits = db.query(VisitModel).all()
        
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Camera ID", "Zone ID", "Track ID", "Entry Time", "Exit Time", "Duration (s)", "Status"])
        
        for v in visits:
            writer.writerow([
                v.id,
                v.camera_id,
                v.zone_id,
                v.track_id,
                v.entry_time.isoformat() if v.entry_time else "",
                v.exit_time.isoformat() if v.exit_time else "",
                v.duration,
                v.status
            ])
            
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]), 
            media_type="text/csv", 
            headers={"Content-Disposition": "attachment; filename=visits_export.csv"}
        )
    finally:
        db.close()
