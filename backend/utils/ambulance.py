import asyncio
import logging
import random
from datetime import datetime

from beanie import PydanticObjectId

from models import Ambulance, AmbulanceStatus, Event, EventStatus
from utils.live_ws import broadcast_all
from schemas import Point

logger = logging.getLogger(__name__)


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
    # Initialize ETA to total number of seconds remaining
    eta_seconds = len(path) * (update_interval_ms / 1000)

    while path:
        next_point = path.pop(0)
        _set_location(ambulance, next_point)
        ambulance.status = status
        ambulance.path = path

        # Update ETA
        ambulance.eta_seconds = max(0, eta_seconds)
        await ambulance.save()
        await broadcast_all("ambulances")

        logger.info(
            "Ambulance %s moved to %s,%s | ETA: %.1fs",
            ambulance.id,
            next_point.lat,
            next_point.lng,
            ambulance.eta_seconds,
        )

        await asyncio.sleep(update_interval_ms / 1000)
        eta_seconds -= update_interval_ms / 1000


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

    await _walk_path(
        ambulance, list(original_path), AmbulanceStatus.ENROUTE, update_interval_ms
    )

    if ambulance.event_id:
        await asyncio.sleep(5)
        event = await Event.get(ambulance.event_id)
        if event and event.status != EventStatus.RESOLVED:
            event.status = EventStatus.RESOLVED
            event.resolved_at = datetime.utcnow()
            await event.save()
            await broadcast_all("events")

    reverse_path = list(reversed(original_path))
    await _walk_path(
        ambulance, reverse_path, AmbulanceStatus.ENROUTE, update_interval_ms
    )

    ambulance.path = []
    ambulance.status = AmbulanceStatus.IDLE
    ambulance.eta = None
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
