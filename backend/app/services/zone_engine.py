from typing import List, Dict, Tuple, Optional
from shapely.geometry import Point, Polygon
from app.schemas.zone import ZoneResponse

class ZoneEngine:
    def __init__(self):
        self.zones: Dict[str, List[ZoneResponse]] = {} # grouped by camera_id
        # Cache shapely Polygons
        self._polygons: Dict[str, Polygon] = {}
        self._load_from_db()

    def _load_from_db(self):
        from app.database import SessionLocal
        from app.models.models import ZoneModel
        import json
        
        db = SessionLocal()
        try:
            zones = db.query(ZoneModel).all()
            for z in zones:
                if z.camera_id not in self.zones:
                    self.zones[z.camera_id] = []
                
                polygon_data = json.loads(z.polygon_json) if z.polygon_json else []
                # Don't convert them to objects if the schema expects tuples/lists. 
                # Let's check schemas/zone.py later if there's an error. 
                # Wait, earlier we were adding ZoneResponse with dicts.
                
                zone_resp = ZoneResponse(
                    id=z.id,
                    camera_id=z.camera_id,
                    name=z.name,
                    polygon=polygon_data,
                    color=z.color,
                    enabled=z.enabled
                )
                self.zones[z.camera_id].append(zone_resp)
                if len(zone_resp.polygon) >= 3:
                    self._polygons[zone_resp.id] = Polygon(zone_resp.polygon)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Failed to load zones from DB: {e}")
        finally:
            db.close()

    def add_zone(self, zone: ZoneResponse):
        if zone.camera_id not in self.zones:
            self.zones[zone.camera_id] = []
        
        # Replace if exists
        self.zones[zone.camera_id] = [z for z in self.zones[zone.camera_id] if z.id != zone.id]
        self.zones[zone.camera_id].append(zone)
        
        # Cache Polygon
        if len(zone.polygon) >= 3:
            self._polygons[zone.id] = Polygon(zone.polygon)

    def remove_zone(self, camera_id: str, zone_id: str):
        if camera_id in self.zones:
            self.zones[camera_id] = [z for z in self.zones[camera_id] if z.id != zone_id]
        if zone_id in self._polygons:
            del self._polygons[zone_id]

    def get_zones_for_camera(self, camera_id: str) -> List[ZoneResponse]:
        return self.zones.get(camera_id, [])

    def calculate_zone_membership(self, camera_id: str, tracks: List[dict], frame_width: int, frame_height: int) -> List[dict]:
        """
        Updates each track dictionary with the current 'zone_id' it resides in.
        Returns the tracks.
        """
        camera_zones = self.zones.get(camera_id, [])
        if not camera_zones:
            for track in tracks:
                track["zone_id"] = None
            return tracks

        for track in tracks:
            # We use bottom_center as ground plane approximation
            bx, by = track["bottom_center"]
            
            # Normalize point relative to frame size
            norm_x = bx / frame_width if frame_width > 0 else 0
            norm_y = by / frame_height if frame_height > 0 else 0
            point = Point(norm_x, norm_y)
            
            assigned_zone = None
            for zone in camera_zones:
                if not zone.enabled:
                    continue
                
                polygon = self._polygons.get(zone.id)
                if polygon and polygon.contains(point):
                    assigned_zone = zone.id
                    break
                    
            track["zone_id"] = assigned_zone
            
        return tracks

zone_engine = ZoneEngine()
