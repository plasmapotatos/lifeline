from fastapi import APIRouter

from routes.root import router as root_router
from routes.events import router as events_router
from routes.process_event import router as process_event_router
from routes.ambulances import router as ambulances_router
from routes.cameras import router as cameras_router
from routes.hospitals import router as hospitals_router
from routes.live import router as live_router

api_router = APIRouter()
api_router.include_router(root_router)
api_router.include_router(events_router)
api_router.include_router(process_event_router)
api_router.include_router(ambulances_router)
api_router.include_router(cameras_router)
api_router.include_router(hospitals_router)
api_router.include_router(live_router)
