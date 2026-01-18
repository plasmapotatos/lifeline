import asyncio
import logging
import random
from datetime import datetime

from beanie import PydanticObjectId

from models import Ambulance, AmbulanceStatus, Event, EventStatus
from utils.live_ws import broadcast_all
from schemas import Point

logger = logging.getLogger(__name__)


def _resolve_status(status_name: str, fallback: AmbulanceStatus) -> AmbulanceStatus:
    return getattr(AmbulanceStatus, status_name, fallback)


def _set_location(ambulance: Ambulance, point: Point) -> None:
    if hasattr(ambulance, "location"):
        ambulance.location = point
    else:
        ambulance.lat = point.lat
        ambulance.lng = point.lng


async def _walk_path(
    ambulance: Ambulance,
    path: list[Point],
    status: AmbulanceStatus,
    update_interval_ms: int,
) -> None:
    while path:
        next_point = path.pop(0)
        _set_location(ambulance, next_point)
        ambulance.status = status
        ambulance.path = path
        await ambulance.save()
        await broadcast_all("ambulances")
        logger.info(
            "Ambulance %s moved to %s,%s",
            ambulance.id,
            next_point.lat,
            next_point.lng,
        )
        await asyncio.sleep(update_interval_ms / 1000)


async def simulate_ambulance(
    ambulance_id: PydanticObjectId,
    update_interval_ms: int = 1000,
):
    """Simulate an ambulance moving along its path and returning."""
    ambulance = await Ambulance.get(ambulance_id)
    if not ambulance:
        raise ValueError(f"Ambulance {ambulance_id} not found")

    if not ambulance.path:
        return

    original_path = list(ambulance.path)

    enroute_status = _resolve_status("ENROUTE", AmbulanceStatus.IDLE)
    returning_status = _resolve_status("RETURNING", AmbulanceStatus.IDLE)
    free_status = _resolve_status("FREE", AmbulanceStatus.IDLE)

    await _walk_path(ambulance, list(original_path), enroute_status, update_interval_ms)

    if ambulance.event_id:
        await asyncio.sleep(5)
        event = await Event.get(ambulance.event_id)
        if event and event.status != EventStatus.RESOLVED:
            event.status = EventStatus.RESOLVED
            event.resolved_at = datetime.utcnow()
            await event.save()
            await broadcast_all("events")

    reverse_path = list(reversed(original_path))
    await _walk_path(ambulance, reverse_path, returning_status, update_interval_ms)

    ambulance.path = []
    ambulance.status = free_status
    await ambulance.save()
    await broadcast_all("ambulances")


if __name__ == "__main__":
    import asyncio
    from main import init_db

    async def main():
        await init_db()
        # Replace with a valid ambulance ID from your database
        ambulance_id = PydanticObjectId("696c2d67f92424a53226ff1b")
        await simulate_ambulance(ambulance_id, update_interval_ms=2000)

    asyncio.run(main())
