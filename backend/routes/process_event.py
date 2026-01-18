from fastapi import APIRouter, HTTPException  # type: ignore
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import math
import random

from choose_ambulance import get_ambulance_and_path
from utils.ambulance import simulate_ambulance

from models import Event, EventStatus, Severity, Camera, Ambulance, AmbulanceStatus
from utils.live_ws import broadcast_all

router = APIRouter(tags=["Process Event"])


class ProcessEventRequest(BaseModel):
    camera_id: str
    severity: Severity
    title: str
    description: str
    reference_clip_url: str


@router.post("/process_event")
async def process_event(request: ProcessEventRequest):
    """Main ingestion endpoint for events from AI/camera service."""
    print(f"[Backend] Received event from camera: {request.camera_id}")
    print(f"[Backend] Event details: {request.title} ({request.severity})")

    # Map camera names to their ports (matches start-all.ts configuration)
    # IMPORTANT: Must match exactly with seed_data.py camera names and start-all.ts names
    # camera_port_map = {
    #     "CAM_12": 5055,
    #     "Astra-12": 5056,  # Matches seed_data.py and start-all.ts
    #     "Astra-18": 5057,  # Matches seed_data.py and start-all.ts
    # }
    # port = camera_port_map.get(request.camera_id, 5055)  # Default to 5055 if unknown

    # Get or create camera by name (camera_id is the camera name like "CAM_12")
    # Try exact match first, then try case-insensitive and variant matching
    camera = await Camera.find_one(Camera.name == request.camera_id)
    # if not camera:
    #     # Try case-insensitive match and variants (hyphen vs underscore)
    #     all_cameras = await Camera.find_all().to_list()
    #     for cam in all_cameras:
    #         if cam.name:
    #             # Exact match (case-insensitive)
    #             if cam.name.lower() == request.camera_id.lower():
    #                 camera = cam
    #                 break
    #             # Variant match (hyphen vs underscore)
    #             normalized_name = cam.name.replace("-", "_")
    #             normalized_request = request.camera_id.replace("-", "_")
    #             if normalized_name.lower() == normalized_request.lower():
    #                 camera = cam
    #                 break

    # if not camera:
    #     print(
    #         f"[Backend] Camera '{request.camera_id}' not found, creating new camera..."
    #     )
    #     # Auto-create camera for hackathon speed
    #     camera = Camera(
    #         lat=40.7501,  # Default location (can be updated later)
    #         lng=-73.9866,
    #         latest_frame_url=f"http://localhost:{port}/latest_frame",
    #         name=request.camera_id,
    #     )
    #     await camera.insert()
    #     await broadcast_all("cameras")
    #     print(f"[Backend] Created new camera: {camera.id} ({camera.name}) on port {port}")
    # else:
    #     # Update existing camera's frame URL if it doesn't match the correct port
    #     expected_url = camera.latest_frame_url
    #     if camera.latest_frame_url != expected_url:
    #         print(f"[Backend] Updating camera {camera.name} frame URL from {camera.latest_frame_url} to {expected_url}")
    #         camera.latest_frame_url = expected_url
    #         await camera.save()
    #         await broadcast_all("cameras")
    #     print(f"[Backend] Found existing camera: {camera.id} ({camera.name}) on port {port}")

    # Add small jitter to event location (mock variation from camera)
    jitter_lat = camera.lat + random.uniform(-0.001, 0.001)
    jitter_lng = camera.lng + random.uniform(-0.001, 0.001)

    # Create event (camera_id is the Camera's _id, not the name)
    event = Event(
        severity=request.severity,
        title=request.title,
        description=request.description,
        reference_clip_url=request.reference_clip_url,
        lat=jitter_lat,
        lng=jitter_lng,
        camera_id=camera.id,  # Use camera's MongoDB _id
        status=EventStatus.OPEN,
        created_at=datetime.now(timezone.utc),
    )
    await event.insert()
    await broadcast_all("events")
    print(f"[Backend] Created event: {event.id} - {event.title} ({event.severity})")

    # If emergency, assign nearest idle ambulance
    if request.severity == Severity.EMERGENCY:
        ambulance, eta, path = await get_ambulance_and_path(event.id)
        if ambulance:
            ambulance.path = path
            ambulance.eta_seconds = eta
            ambulance.event_id = event.id
            await ambulance.save()
            await simulate_ambulance(ambulance.id)

    return {"ok": True, "event": event}
