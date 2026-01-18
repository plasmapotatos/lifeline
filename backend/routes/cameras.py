from beanie import PydanticObjectId  # type: ignore
from fastapi import APIRouter, HTTPException  # type: ignore
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timezone
import math
import random

from choose_ambulance import get_ambulance_and_path
from utils.ambulance import simulate_ambulance
from models import Camera, Event, EventStatus, Severity, Ambulance, AmbulanceStatus
from utils.live_ws import broadcast_all

router = APIRouter(prefix="/cameras", tags=["Cameras"])


@router.get("", response_model=List[Camera])
async def get_cameras():
    """Get all cameras."""
    cameras = await Camera.find_all().to_list()
    return cameras


class ManualEmergencyRequest(BaseModel):
    description: str
    reference_clip_url: str


@router.post("/{camera_id}/trigger_emergency")
async def trigger_emergency(
    camera_id: str,
    payload: ManualEmergencyRequest,
):
    """Manually trigger an emergency event for a camera."""
    camera = await Camera.find_one(Camera.id == PydanticObjectId(camera_id))
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    # Add small jitter to event location
    jitter_lat = camera.lat + random.uniform(-0.001, 0.001)
    jitter_lng = camera.lng + random.uniform(-0.001, 0.001)

    event = Event(
        severity=Severity.EMERGENCY,
        title="Manual detection triggered",
        description=payload.description,
        reference_clip_url=payload.reference_clip_url,
        lat=jitter_lat,
        lng=jitter_lng,
        camera_name=camera.name,
        status=EventStatus.OPEN,
        created_at=datetime.now(timezone.utc),
    )

    await event.insert()
    await broadcast_all("events")

    # Assign nearest idle ambulance
    ambulance, eta, path = await get_ambulance_and_path(event.id)
    if ambulance:
        ambulance.path = path
        ambulance.eta_seconds = eta
        ambulance.event_id = event.id
        await ambulance.save()
        await simulate_ambulance(ambulance.id)
    else:
        print("[Backend] No idle ambulances available to assign.")

    print(f"[Backend] Manual emergency triggered for camera {camera_id}")

    return {
        "ok": True,
        "event": event,
        "message": "Emergency triggered: Manual detection triggered",
    }
