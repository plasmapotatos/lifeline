from beanie import PydanticObjectId  # type: ignore
from fastapi import APIRouter, HTTPException  # type: ignore
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timezone
import math
import random

from models import Camera, Event, EventStatus, Severity, Ambulance, AmbulanceStatus
from utils.live_ws import broadcast_all

router = APIRouter(prefix="/cameras", tags=["Cameras"])


class RegisterCameraRequest(BaseModel):
    id: str
    lat: float
    lng: float
    latest_frame_url: str
    name: Optional[str] = None


@router.get("", response_model=List[Camera])
async def get_cameras():
    """Get all cameras."""
    cameras = await Camera.find_all().to_list()
    # Ensure all cameras have correct URLs based on their names
    # This fixes any cameras that might have been created with wrong URLs
    # Handle both hyphen and underscore variants (e.g., "Astra-18" vs "Astra_18")
    # NOTE: All three cameras in DB currently have port 5055 - this fixes Astra-12 and Astra-18
    camera_port_map = {
        "CAM_12": 5055,  # CAM cameras use underscores
        "Astra-12": 5056,  # Currently wrong (5055), should be 5056
        "Astra-18": 5057,  # Astra cameras use hyphens
    }
    updated = False
    for camera in cameras:
        if camera.name:
            # Check exact match first
            expected_port = camera_port_map.get(camera.name)
            # If no exact match, try normalized name (hyphen/underscore variants)
            if expected_port is None:
                normalized_name = camera.name.replace("-", "_")
                expected_port = camera_port_map.get(normalized_name)
                if expected_port is None:
                    normalized_name = camera.name.replace("_", "-")
                    expected_port = camera_port_map.get(normalized_name)
            
            if expected_port is not None:
                expected_url = f"http://localhost:{expected_port}/latest_frame"
                if camera.latest_frame_url != expected_url:
                    camera.latest_frame_url = expected_url
                    await camera.save()
                    updated = True
    
    if updated:
        # Re-fetch to return updated cameras
        cameras = await Camera.find_all().to_list()
    
    return cameras


@router.post("/register")
async def register_camera(request: RegisterCameraRequest):
    """Register a new camera."""
    # Check if camera already exists by name
    existing = await Camera.find_one(Camera.name == (request.name or request.id))
    if existing:
        raise HTTPException(status_code=400, detail="Camera already exists")

    camera = Camera(
        lat=request.lat,
        lng=request.lng,
        latest_frame_url=request.latest_frame_url,
        name=request.name or request.id,
    )
    await camera.insert()
    await broadcast_all("cameras")

    return {"ok": True, "camera": camera}


def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two points in kilometers (Haversine formula)."""
    R = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlng / 2) ** 2
    )
    c = 2 * math.asin(math.sqrt(a))
    return R * c


async def find_nearest_idle_ambulance(
    event_lat: float, event_lng: float
) -> Optional[Ambulance]:
    """Find the nearest idle ambulance to the event location."""
    ambulances = await Ambulance.find(
        Ambulance.status == AmbulanceStatus.IDLE
    ).to_list()

    if not ambulances:
        return None

    nearest = None
    min_distance = float("inf")

    for ambulance in ambulances:
        distance = calculate_distance(
            event_lat, event_lng, ambulance.lat, ambulance.lng
        )
        if distance < min_distance:
            min_distance = distance
            nearest = ambulance

    return nearest


@router.post("/{camera_id}/trigger_emergency")
async def trigger_emergency(camera_id: str):
    """Manually trigger an emergency event for a camera."""
    # Get camera by name (camera_id is the camera name like "CAM_12" or "Astra-12")
    print(camera_id)
    camera = await Camera.find_one(Camera.id == PydanticObjectId(camera_id))
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    # Realistic emergency scenarios
    emergency_scenarios = [
        {
            "title": "Person collapsed on sidewalk",
            "description": "Individual appears to have collapsed and is not moving. Immediate medical attention required.",
        },
        {
            "title": "Medical emergency in progress",
            "description": "Person showing signs of medical distress requiring urgent assistance.",
        },
        {
            "title": "Unconscious person detected",
            "description": "Individual found unconscious and unresponsive. Emergency response needed.",
        },
        {
            "title": "Person requires immediate aid",
            "description": "Medical emergency observed. Individual appears to need urgent medical assistance.",
        },
        {
            "title": "Medical distress situation",
            "description": "Person showing visible signs of medical emergency. Immediate response required.",
        },
        {
            "title": "Person down, not responding",
            "description": "Individual on ground showing no signs of movement. Medical emergency confirmed.",
        },
    ]

    # Select a random realistic scenario
    scenario = random.choice(emergency_scenarios)

    # Add small jitter to event location
    jitter_lat = camera.lat + random.uniform(-0.001, 0.001)
    jitter_lng = camera.lng + random.uniform(-0.001, 0.001)

    # Create emergency event (camera_id is the Camera's _id, not the name)
    event = Event(
        severity=Severity.EMERGENCY,
        title=scenario["title"],
        description=scenario["description"],
        reference_clip_url=f"http://localhost:5055/latest_clip.mp4",
        lat=jitter_lat,
        lng=jitter_lng,
        camera_id=camera.id,  # Use camera's MongoDB _id
        status=EventStatus.OPEN,
        created_at=datetime.now(timezone.utc),
    )
    await event.insert()
    await broadcast_all("events")

    # Assign nearest idle ambulance
    ambulance = await find_nearest_idle_ambulance(jitter_lat, jitter_lng)
    if ambulance:
        # Calculate initial ETA
        distance = calculate_distance(
            jitter_lat, jitter_lng, ambulance.lat, ambulance.lng
        )
        eta_seconds = int((distance / 60) * 3600)  # Assume 60 km/h average speed

        ambulance.status = AmbulanceStatus.ENROUTE
        ambulance.event_id = event.id
        ambulance.eta_seconds = eta_seconds
        ambulance.updated_at = datetime.now(timezone.utc)
        await ambulance.save()
        await broadcast_all("ambulances")

        event.ambulance_id = ambulance.id
        event.status = EventStatus.ENROUTE
        await event.save()
        await broadcast_all("events")

    print(
        f"[Backend] Manual emergency triggered for camera {camera_id}: {scenario['title']}"
    )

    return {
        "ok": True,
        "event": event,
        "message": f"Emergency triggered: {scenario['title']}",
    }
