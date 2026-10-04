import threading
import time
import cv2
import logging
from typing import Optional
from app.config import settings

logger = logging.getLogger(__name__)

class CameraWorker:
    def __init__(self, camera_id: str, source_path: str, repeat: bool = True):
        self.camera_id = camera_id
        self.source_path = source_path
        self.repeat = repeat
        
        self.stop_event = threading.Event()
        self.thread: Optional[threading.Thread] = None
        self.status = "stopped"
        
        self.frames_processed = 0
        self.processing_fps = 0.0
        self.last_error: Optional[str] = None
        self.capture: Optional[cv2.VideoCapture] = None

    def start(self):
        if self.thread and self.thread.is_alive():
            logger.warning(f"Worker for camera {self.camera_id} is already running.")
            return

        self.stop_event.clear()
        self.status = "starting"
        self.thread = threading.Thread(target=self._process_loop, daemon=True)
        self.thread.start()

    def stop(self):
        self.stop_event.set()
        if self.thread:
            self.thread.join(timeout=5.0)
        self.status = "stopped"
        if self.capture:
            self.capture.release()
            self.capture = None

    def _process_loop(self):
        self.status = "running"
        retry_delays = [1, 2, 4, 8, 15, 30]
        retry_count = 0
        
        target_fps = settings.target_fps
        frame_time = 1.0 / target_fps if target_fps > 0 else 0

        while not self.stop_event.is_set():
            if self.capture is None or not self.capture.isOpened():
                # Attempt to open source
                try:
                    # Synthetic source for demo purposes
                    if self.source_path.startswith("synthetic"):
                        self.capture = None # Handled differently in a real implementation
                        raise NotImplementedError("Synthetic video not fully implemented here yet")
                    
                    self.capture = cv2.VideoCapture(self.source_path)
                    if not self.capture.isOpened():
                        raise Exception(f"Failed to open source {self.source_path}")
                    
                    retry_count = 0
                    self.last_error = None
                    self.status = "running"
                except Exception as e:
                    self.last_error = str(e)
                    self.status = "error"
                    delay = retry_delays[min(retry_count, len(retry_delays) - 1)]
                    logger.error(f"Camera {self.camera_id} error: {e}. Retrying in {delay}s...")
                    retry_count += 1
                    
                    # Sleep interruptable by stop_event
                    if self.stop_event.wait(delay):
                        break
                    continue

            start_time = time.time()

            success, frame = self.capture.read()

            if not success:
                # End of file or disconnection
                if self.repeat and not self.source_path.startswith(("http", "rtsp")):
                    # It's likely a local file that ended. Loop it.
                    self.capture.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    continue
                else:
                    self.status = "disconnected"
                    self.capture.release()
                    self.capture = None
                    # Fallback to retry loop for RTSP
                    if self.source_path.startswith(("http", "rtsp")):
                        continue
                    else:
                        break # Stop on file end if not repeating

            # --- FRAME PREPROCESSING ---
            # Resize frame according to config
            if settings.resize_width > 0 and settings.resize_height > 0:
                frame = cv2.resize(frame, (settings.resize_width, settings.resize_height))

            # TODO: Phase 3 - Detect & Track
            # TODO: Phase 4 - Calculate Zone Membership
            
            # Sleep to maintain target FPS
            sleep_time = frame_time - (time.time() - start_time)
            if sleep_time > 0:
                self.stop_event.wait(sleep_time)

            self.frames_processed += 1
            
            # Simple FPS calculation including sleep
            elapsed = time.time() - start_time
            if elapsed > 0:
                self.processing_fps = 0.9 * self.processing_fps + 0.1 * (1.0 / elapsed)

        # Cleanup
        if self.capture:
            self.capture.release()
            self.capture = None
        self.status = "stopped"
