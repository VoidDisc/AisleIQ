from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import asyncio
from app.services.camera_manager import camera_manager

router = APIRouter(prefix="/api/stream", tags=["stream"])

async def frame_generator(camera_id: str):
    while True:
        worker = camera_manager.workers.get(camera_id)
        if worker and worker.latest_frame:
            frame_bytes = worker.latest_frame
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        else:
            # Send a blank frame or just wait
            await asyncio.sleep(0.1)
            continue
        await asyncio.sleep(1/30.0) # limit stream rate

@router.get("/{camera_id}")
async def video_stream(camera_id: str):
    return StreamingResponse(
        frame_generator(camera_id), 
        media_type="multipart/x-mixed-replace; boundary=frame"
    )
