import logging
from typing import Any

from fastapi import WebSocket
from fastapi.encoders import jsonable_encoder

from models import Ambulance, Event, Camera

logger = logging.getLogger(__name__)


async def broadcast_all(type: str):
    """Broadcast the current state of all ambulances to connected clients."""
    if type == "ambulances":
        all_ambulances = await Ambulance.find_all().to_list()
        print("Broadcasting ambulances:", all_ambulances)
        await broadcast_update("ambulances", all_ambulances)
    if type == "events":
        all_events = await Event.find_all().to_list()
        await broadcast_update("events", all_events)
    if type == "cameras":
        all_cameras = await Camera.find_all().to_list()
        await broadcast_update("cameras", all_cameras)


class LiveConnectionManager:
    def __init__(self) -> None:
        self._connections: set[WebSocket] = set()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections.add(websocket)
        logger.info("Live WS connected (%s clients)", len(self._connections))

    async def disconnect(self, websocket: WebSocket) -> None:
        self._connections.discard(websocket)
        logger.info("Live WS disconnected (%s clients)", len(self._connections))

    async def broadcast(self, payload: dict[str, Any]) -> None:
        if not self._connections:
            return
        dead: list[WebSocket] = []
        for websocket in self._connections:
            try:
                await websocket.send_json(payload)
            except Exception:
                dead.append(websocket)
        for websocket in dead:
            self._connections.discard(websocket)

    def connection_count(self) -> int:
        return len(self._connections)


manager = LiveConnectionManager()


async def broadcast_update(entity_type: str, data: Any) -> None:
    payload = {"type": entity_type, "data": jsonable_encoder(data)}
    await manager.broadcast(payload)
