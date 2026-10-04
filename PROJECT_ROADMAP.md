# AisleIQ: Project Status & Roadmap

Welcome to the **AisleIQ** project documentation. This file outlines the complete system architecture, all features built so far (Phases 1-18), and the proposed future roadmap.

## 🏗️ Architecture Overview

AisleIQ is an end-to-end Computer Vision analytics platform built for retail and physical security, designed to run locally on Apple Silicon / CPU hardware.

*   **Backend:** Python 3.11, FastAPI, SQLAlchemy (SQLite), OpenCV, Ultralytics (YOLOv8 + ByteTrack).
*   **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v3, Recharts, Lucide Icons.
*   **Database:** SQLite (`aisleiq.db`) for lightweight local persistence.
*   **Infrastructure:** Dockerized with `docker-compose`.

---

## ✅ What's Built So Far (Phases 1 - 18)

### 1. Core Computer Vision Pipeline
*   **YOLOv8 & ByteTrack Integration (`camera_worker.py`, `detector.py`)**: Real-time object detection and persistent tracking across frames.
*   **MJPEG Streaming (`stream.py`)**: High-performance frame encoding allowing the frontend to render processed video streams seamlessly.

### 2. Physical Zone Tracking & Analytics
*   **Interactive Zone Editor (`ZoneEditor.tsx`)**: An SVG-based UI overlay allowing users to draw and define physical zones over live camera feeds.
*   **Zone Engine (`zone_engine.py`)**: Uses `shapely` polygons to calculate when a tracked person enters or exits a predefined physical zone.
*   **Database Persistence (`zones.py`, `models.py`)**: Zones are serialized and stored in SQLite, allowing them to persist across server restarts.

### 3. Dwell Time & Event Management
*   **Visit Manager (`visit_manager.py`)**: Maintains memory of tracked entities, calculating entrance times, exit times, and dwell durations.
*   **Alert Engine (`alerts.py`)**: Continuously monitors the `VisitManager`. If a person dwells in a specific zone for >60 seconds, an alert is triggered and persisted to the database.

### 4. Telemetry & Export
*   **WebSocket Telemetry (`event_manager.py`, `useWebSocket.ts`)**: Broadcasts real-time events (camera status, detections) to the frontend.
*   **CSV Data Export (`export.py`)**: API endpoint enabling users to download historic dwell and visit analytics.

### 5. Frontend Interfaces
*   **Dashboard (`Dashboard.tsx`)**: High-level system overview. Features Recharts for tracking hourly visits, active alerts panels with resolution actions, and time-range filtering (All Time vs Last 24 Hours).
*   **Live Grid View (`LiveView.tsx`)**: A multiplexed real-time grid rendering all running camera feeds simultaneously for an Operations Center experience.
*   **Settings & Audit Logs (`Settings.tsx`, `logs.py`)**: System settings including a terminal-like viewer for tailing the backend `aisleiq.log` file directly in the browser.

---

## 🚀 What's Left to Build (Future Roadmap)

### Phase 19: Authentication & Authorization
*   **JWT Security:** Lock down the FastAPI endpoints and React router.
*   **RBAC (Role-Based Access Control):** Introduce `Admin` vs `Viewer` roles (e.g., Viewers can watch the Live Grid but cannot draw/edit zones or resolve alerts).

### Phase 20: Advanced Analytics & Demographics
*   **Face/Attribute Recognition:** Feed YOLO bounding box crops into a secondary classifier to estimate demographics (Age/Gender) or clothing colors for deeper retail insights.
*   **Path Tracing Visualization:** Instead of just calculating dwell time, draw "spaghetti maps" overlaying the exact walking paths of customers onto the Zone Editor.

### Phase 21: NVR (Network Video Recorder) Event Clipping
*   **Video Recording:** When a dwell alert (>60s) is triggered, save a 10-second `mp4` video clip of the event to disk.
*   **Playback UI:** Allow users to click an alert in the Dashboard to replay the historical video clip.

### Phase 22: Heatmap Overlays
*   **Coordinate Accumulation:** Log raw `(x, y)` coordinate density from the tracker.
*   **Thermal Rendering:** Render a color-graded thermal overlay on the camera stream to visualize the most heavily trafficked floor spaces (true heatmap).

### Phase 23: UI/UX Refinement
*   **Zone Editor Handles:** Upgrade the Zone Editor to allow dragging and modifying existing polygon points, rather than requiring the user to delete and redraw zones.
*   **Dark/Light Mode:** Introduce a robust theme switcher.

### Phase 24: Cloud & Edge Scalability
*   **PostgreSQL Migration:** Migrate the SQLAlchemy configuration from local SQLite to a distributed PostgreSQL database.
*   **Kafka/RabbitMQ:** Decouple the `event_manager` WebSockets to scale across multiple backend container instances.

### Phase 25: Queue Management & Overcrowding
*   **Capacity Limits:** Allow users to define a `max_capacity` limit on individual tracking zones.
*   **Crowd Alerts:** Trigger an immediate alert if the number of simultaneous dwell sessions inside a zone exceeds its configured threshold.

### Phase 26: Point of Sale (POS) & Business Metrics Integration
*   **Webhook Ingestion:** Create `/api/webhooks/pos` to ingest real-time sales transactions from external registers.
*   **Conversion Analytics:** Correlate the total number of unique store visits with total transaction volume.
*   **Business Dashboard:** Introduce `Revenue` and `Conversion Rate` UI widgets to the primary Dashboard.

### Phase 27: Advanced Security - Intrusion Detection
*   **System Arming:** Allow admins to "Arm" the analytics system during off-hours.
*   **Zero-Dwell Intrusion Alerts:** If the system is armed, bypass the standard dwell-time rules and instantly trigger a critical "INTRUSION DETECTED" alert the moment any person is detected in the camera feed.
