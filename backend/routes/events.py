from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from models import Event, EventStatus, Ambulance, AmbulanceStatus, Camera
from utils.live_ws import broadcast_all
from beanie import PydanticObjectId

router = APIRouter(prefix="/events", tags=["Events"])


class EventResponse(BaseModel):
    """Response model for events that converts _id to id and ObjectIds to strings."""

    id: str
    severity: str
    title: str
    description: str
    reference_clip_url: str
    lat: float
    lng: float
    camera_id: str
    camera_name: Optional[str] = None
    ambulance_id: Optional[str] = None
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None

    @classmethod
    async def from_event(cls, event: Event) -> "EventResponse":
        """Convert Event document to EventResponse."""
        # Fetch camera name if camera_id exists
        camera_name = None
        if event.camera_id:
            camera = await Camera.get(event.camera_id)
            camera_name = camera.name if camera else None
        
        return cls(
            id=str(event.id),
            severity=event.severity.value,
            title=event.title,
            description=event.description,
            reference_clip_url=event.reference_clip_url,
            lat=event.lat,
            lng=event.lng,
            camera_id=str(event.camera_id),
            camera_name=camera_name,
            ambulance_id=str(event.ambulance_id) if event.ambulance_id else None,
            status=event.status.value,
            created_at=event.created_at,
            resolved_at=event.resolved_at,
        )


@router.get("", response_model=List[EventResponse])
async def get_events(status: Optional[EventStatus] = None):
    """Get all events, optionally filtered by status."""
    if status:
        events = await Event.find(Event.status == status).to_list()
    else:
        events = await Event.find_all().to_list()

    # Convert Event documents to EventResponse with camera names
    return [await EventResponse.from_event(event) for event in events]


@router.post("/{event_id}/resolve")
async def resolve_event(event_id: int):
    """Mark an event as resolved and free the assigned ambulance."""
    event = await Event.get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    event.status = EventStatus.RESOLVED
    event.resolved_at = datetime.utcnow()

    # Free the ambulance
    if event.ambulance_id:
        ambulance = await Ambulance.get(event.ambulance_id)
        if ambulance:
            ambulance.status = AmbulanceStatus.IDLE
            ambulance.event_id = None
            ambulance.eta_seconds = None
            ambulance.updated_at = datetime.utcnow()
            await ambulance.save()
            await broadcast_all("ambulances")

    await event.save()
    await broadcast_all("events")

    return {"ok": True, "event": event}
