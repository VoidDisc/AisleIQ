from datetime import datetime, timedelta
from app.services.zone_engine import zone_engine
from app.services.visit_manager import visit_manager
from app.schemas.zone import ZoneResponse

def run_test():
    cam_id = "test-cam"
    zone = ZoneResponse(
        id="zone-1",
        name="Aisle 1",
        camera_id=cam_id,
        polygon=[(0.0, 0.0), (0.5, 0.0), (0.5, 1.0), (0.0, 1.0)] # Left half of screen
    )
    zone_engine.add_zone(zone)
    
    start_time = datetime.utcnow()
    
    # Simulate track entering zone
    tracks = [{"track_id": 1, "bottom_center": [0.25, 0.5]}] # inside [0, 0.5]
    tracks = zone_engine.calculate_zone_membership(cam_id, tracks, 1.0, 1.0)
    print("t=0", tracks)
    visit_manager.process_observations(cam_id, tracks, start_time)
    
    # Stay in zone for 2 seconds
    tracks = zone_engine.calculate_zone_membership(cam_id, tracks, 1.0, 1.0)
    visit_manager.process_observations(cam_id, tracks, start_time + timedelta(seconds=2))
    
    # Move out of zone
    tracks = [{"track_id": 1, "bottom_center": [0.75, 0.5]}] # outside [0, 0.5]
    tracks = zone_engine.calculate_zone_membership(cam_id, tracks, 1.0, 1.0)
    print("t=3", tracks)
    visit_manager.process_observations(cam_id, tracks, start_time + timedelta(seconds=3))
    
    # Check history
    print(f"Recorded visits: {len(visit_manager.history)}")
    for v in visit_manager.history:
        print(f"Visit: {v.track_id} in {v.zone_id} for {v.duration}s")

if __name__ == "__main__":
    run_test()
