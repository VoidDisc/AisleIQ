import uuid
from typing import Dict, List, Optional
from datetime import datetime
from app.schemas.visit import VisitSession
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class VisitManager:
    def __init__(self):
        # camera_id -> { track_id -> VisitSession }
        self.active_sessions: Dict[str, Dict[int, VisitSession]] = {}
        # Simple in-memory history for prototype
        self.history: List[VisitSession] = []

    def process_observations(self, camera_id: str, tracks: List[dict], current_time: datetime):
        if camera_id not in self.active_sessions:
            self.active_sessions[camera_id] = {}
            
        cam_sessions = self.active_sessions[camera_id]
        
        # Track which tracks were seen in this frame
        seen_track_ids = set()

        for track in tracks:
            track_id = track["track_id"]
            zone_id = track.get("zone_id")
            seen_track_ids.add(track_id)
            
            if track_id in cam_sessions:
                session = cam_sessions[track_id]
                
                # Did the person change zones or leave all zones?
                if session.zone_id != zone_id:
                    self._close_session(session, current_time, "completed")
                    del cam_sessions[track_id]
                    
                    # Start new session if they entered a new zone
                    if zone_id:
                        cam_sessions[track_id] = self._create_session(camera_id, zone_id, track_id, current_time)
                else:
                    # Update duration for active session
                    session.duration = (current_time - session.entry_time).total_seconds()
            else:
                # Not currently in a session
                if zone_id:
                    cam_sessions[track_id] = self._create_session(camera_id, zone_id, track_id, current_time)

        # Handle track loss (timeout)
        lost_tracks = []
        for track_id, session in cam_sessions.items():
            if track_id not in seen_track_ids:
                # Calculate time since we last saw them based on their duration
                last_seen_time = session.entry_time.timestamp() + session.duration
                time_lost = current_time.timestamp() - last_seen_time
                
                if time_lost > settings.track_loss_timeout:
                    # Close session
                    self._close_session(session, datetime.fromtimestamp(last_seen_time), "completed")
                    lost_tracks.append(track_id)
                    
        for track_id in lost_tracks:
            del cam_sessions[track_id]

    def handle_camera_stop(self, camera_id: str, current_time: datetime):
        """Close all active sessions for a stopped camera."""
        if camera_id in self.active_sessions:
            for track_id, session in self.active_sessions[camera_id].items():
                self._close_session(session, current_time, "interrupted")
            self.active_sessions[camera_id].clear()

    def _create_session(self, camera_id: str, zone_id: str, track_id: int, entry_time: datetime) -> VisitSession:
        return VisitSession(
            id=str(uuid.uuid4()),
            camera_id=camera_id,
            zone_id=zone_id,
            track_id=track_id,
            entry_time=entry_time
        )
        
    def _close_session(self, session: VisitSession, exit_time: datetime, status: str):
        session.exit_time = exit_time
        session.duration = (exit_time - session.entry_time).total_seconds()
        
        if session.duration >= settings.min_visit_duration or status == "interrupted":
            session.status = status
            self.history.append(session)
            
            # Check for dwell time alert (prototype hardcoded threshold: 60 seconds)
            if session.duration > 60:
                self._create_alert(
                    alert_type="dwell_time",
                    message=f"Person {session.track_id} lingered in {session.zone_id} for {session.duration:.1f}s",
                    zone_id=session.zone_id,
                    camera_id=session.camera_id
                )
            
            # Persist to database
            from app.database import SessionLocal
            from app.models.models import VisitModel
            
            db = SessionLocal()
            try:
                db_visit = VisitModel(
                    id=session.id,
                    camera_id=session.camera_id,
                    zone_id=session.zone_id,
                    track_id=session.track_id,
                    entry_time=session.entry_time,
                    exit_time=session.exit_time,
                    duration=session.duration,
                    status=session.status
                )
                db.add(db_visit)
                db.commit()
            except Exception as e:
                logger.error(f"Failed to persist visit {session.id}: {e}")
            finally:
                db.close()
        else:
            # Drop short sessions
            pass

    def _create_alert(self, alert_type: str, message: str, zone_id: str, camera_id: str):
        from app.database import SessionLocal
        from app.models.models import AlertModel
        from app.services.event_manager import event_manager
        import asyncio
        
        db = SessionLocal()
        try:
            alert = AlertModel(
                type=alert_type,
                message=message,
                zone_id=zone_id,
                camera_id=camera_id
            )
            db.add(alert)
            db.commit()
            db.refresh(alert)
            
            alert_data = {
                "id": alert.id,
                "type": alert.type,
                "message": alert.message,
                "zone_id": alert.zone_id,
                "timestamp": alert.timestamp.isoformat()
            }
            
            # We are likely running in a background thread
            try:
                loop = asyncio.get_running_loop()
                loop.create_task(event_manager.broadcast("new_alert", alert_data))
            except RuntimeError:
                pass # not in async context, safely ignore broadcast
        except Exception as e:
            logger.error(f"Failed to create alert: {e}")
        finally:
            db.close()

visit_manager = VisitManager()
