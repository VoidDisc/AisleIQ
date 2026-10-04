import logging
from ultralytics import YOLO
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class Detector:
    def __init__(self, model_name: str = "yolov8n.pt", conf_threshold: float = 0.3):
        self.model_name = model_name
        self.conf_threshold = conf_threshold
        logger.info(f"Loading YOLO model: {self.model_name} with conf={self.conf_threshold}")
        # YOLOv8 handles ByteTrack internally if we call `model.track(..., tracker="bytetrack.yaml")`
        self.model = YOLO(self.model_name)
        
    def detect_and_track(self, frame) -> List[Dict[str, Any]]:
        """
        Runs object detection and tracking on the given frame.
        Returns a list of tracked people with their bounding boxes, IDs, and positions.
        """
        # Run tracking. persist=True tells the tracker to remember tracks across frames
        # classes=0 filters to only detect 'person' (class 0 in COCO)
        results = self.model.track(
            frame,
            persist=True,
            classes=[0],
            conf=self.conf_threshold,
            tracker="bytetrack.yaml",
            verbose=False
        )
        
        tracked_objects = []
        if not results or not results[0].boxes:
            return tracked_objects
            
        boxes = results[0].boxes
        
        # Ensure we have tracking IDs
        if boxes.id is None:
            return tracked_objects
            
        for i in range(len(boxes.id)):
            track_id = int(boxes.id[i])
            conf = float(boxes.conf[i])
            # Bounding box [x1, y1, x2, y2]
            x1, y1, x2, y2 = boxes.xyxy[i].tolist()
            
            # Center point
            cx = (x1 + x2) / 2
            cy = (y1 + y2) / 2
            
            # Bottom-center point (useful for ground plane approximation)
            bottom_cx = cx
            bottom_cy = y2
            
            # Extract dominant color (stub for clothing color)
            # Take a small patch from the upper body (approx middle of top half)
            color_name = "Unknown"
            try:
                import cv2
                import numpy as np
                patch_y1 = int(y1 + (y2 - y1) * 0.2)
                patch_y2 = int(y1 + (y2 - y1) * 0.5)
                patch_x1 = int(x1 + (x2 - x1) * 0.3)
                patch_x2 = int(x1 + (x2 - x1) * 0.7)
                
                if patch_y2 > patch_y1 and patch_x2 > patch_x1:
                    patch = frame[patch_y1:patch_y2, patch_x1:patch_x2]
                    if patch.size > 0:
                        # Simple average color (BGR)
                        avg_color_per_row = np.average(patch, axis=0)
                        avg_color = np.average(avg_color_per_row, axis=0)
                        b, g, r = avg_color
                        
                        # Basic classification
                        if r > g + 20 and r > b + 20:
                            color_name = "Red"
                        elif b > r + 20 and b > g + 20:
                            color_name = "Blue"
                        elif g > r + 20 and g > b + 20:
                            color_name = "Green"
                        elif r > 200 and g > 200 and b > 200:
                            color_name = "White"
                        elif r < 50 and g < 50 and b < 50:
                            color_name = "Black"
                        else:
                            color_name = "Mixed"
            except Exception as e:
                logger.error(f"Color extraction failed: {e}")

            tracked_objects.append({
                "track_id": track_id,
                "confidence": conf,
                "bbox": [x1, y1, x2, y2],
                "center": [cx, cy],
                "bottom_center": [bottom_cx, bottom_cy],
                "dominant_color": color_name
            })
            
        return tracked_objects
