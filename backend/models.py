from beanie import Document, PydanticObjectId
from typing import Optional
from datetime import datetime
from enum import Enum

from schemas import Point


class Severity(str, Enum):
    INFORMATIONAL = "informational"
    EMERGENCY = "emergency"


class EventStatus(str, Enum):
    OPEN = "open"
    ENROUTE = "enroute"
    RESOLVED = "resolved"


class AmbulanceStatus(str, Enum):
    IDLE = "idle"
    ENROUTE = "enroute"
    UNAVAILABLE = "unavailable"


class Camera(Document):
    lat: float
    lng: float
    latest_frame_url: str
    name: Optional[str] = None

    class Settings:
        name = "cameras"
        use_cache = False


class Event(Document):
    severity: Severity
    title: str
    description: str
    reference_clip_url: str
    lat: float
    lng: float
    camera_id: PydanticObjectId
    ambulance_id: Optional[PydanticObjectId] = None
    status: EventStatus = EventStatus.OPEN
    created_at: datetime
    dispatched_at: datetime | None = None
    resolved_at: Optional[datetime] = None

    class Settings:
        name = "events"


class Ambulance(Document):
    lat: float
    lng: float
    status: AmbulanceStatus = AmbulanceStatus.IDLE
    event_id: Optional[PydanticObjectId] = None
    eta_seconds: Optional[int] = None
    updated_at: datetime
    path: list[Point] | None = None

    class Settings:
        name = "ambulances"


class Hospital(Document):
    name: str
    lat: float
    lng: float

    class Settings:
        name = "hospitals"
