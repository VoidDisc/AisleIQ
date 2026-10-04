# AisleIQ — AI-Powered Retail Intelligence Platform

AisleIQ is a retail CCTV analytics platform prototype. It uses Computer Vision (YOLOv8 + ByteTrack) to analyze camera feeds, detect people, and calculate dwell times across customizable shelf zones.

## Features
1. **Live Analytics Dashboard:** Real-time WebSocket updates of active cameras, FPS, tracked shoppers, and total visits.
2. **Zone Editor & Heatmaps:** Draw polygon zones over a camera feed and view historical visit heatmaps.
3. **Computer Vision Pipeline:** Tracks individuals using a pretrained YOLO model, mapping ground-plane coordinates to virtual shelf zones.
4. **Camera Management:** Add local video files or RTSP streams and easily toggle processing on or off.
5. **Persistence:** Stores camera configurations, custom zones, and visit histories in a SQLite database.

## Setup Instructions

### Option A: Docker Compose (Recommended)
You can launch the entire stack (Frontend + Backend) with a single command:
```bash
docker-compose up --build -d
```
The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:8000`.

### Option B: Local Setup

#### 1. Backend (Python/FastAPI)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
*(Note: A pretrained `yolov8n.pt` model is automatically downloaded/used by the `ultralytics` package on first run).*

### 2. Frontend (React/Vite)
```bash
cd frontend
npm install
npm run dev
```

### 3. Generate a Test Video
To test the tracking pipeline without an RTSP camera:
```bash
cd scripts
python generate_test_video.py
```
This generates `test_video.mp4` in the project root. You can add it in the UI Camera Manager by setting the Source Path to `../test_video.mp4`.

## Architecture
- **Backend:** FastAPI, OpenCV, Ultralytics YOLO, ByteTrack, SQLAlchemy, SQLite.
- **Frontend:** React, TypeScript, Tailwind CSS, Recharts, Lucide Icons.
- **Communication:** REST APIs for CRUD operations; WebSockets for live telemetry.
