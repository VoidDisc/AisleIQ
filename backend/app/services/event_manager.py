import asyncio
import json
from typing import List
from fastapi import WebSocket
import logging

logger = logging.getLogger(__name__)

class EventManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast(self, message_type: str, data: dict):
        if not self.active_connections:
            return
            
        message = json.dumps({"type": message_type, "data": data})
        
        # Create a list of disconnected clients to remove them after iterating
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                disconnected.append(connection)
                
        for connection in disconnected:
            self.disconnect(connection)

    def publish_sync(self, message_type: str, data: dict):
        """
        Helper to publish events from synchronous code (like our worker threads).
        Requires a running event loop to attach to, or we create a task.
        """
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(self.broadcast(message_type, data))
        except RuntimeError:
            # If no running loop in this thread, we can't easily broadcast directly.
            # In a real app, we'd use a message queue or pass to the main event loop.
            pass

event_manager = EventManager()
