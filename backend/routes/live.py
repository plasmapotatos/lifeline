from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from utils.live_ws import manager

router = APIRouter(tags=["Live"])


@router.get("/ws/live/clients")
async def get_live_client_count():
    return {"connections": manager.connection_count()}


@router.websocket("/ws/live")
async def live_updates(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await manager.disconnect(websocket)
    except Exception:
        await manager.disconnect(websocket)
