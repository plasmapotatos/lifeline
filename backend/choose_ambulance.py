#!/usr/bin/env python3
from database import init_db
import asyncio
from pathlib import Path
import sys


# Allow imports from parent directory
sys.path.insert(0, str(Path(__file__).parent.parent))

from models import Ambulance, AmbulanceStatus, Event, PydanticObjectId


from datetime import datetime
from models import Ambulance, AmbulanceStatus
from maps_call import compute_route_eta_and_path
from routes.cameras import calculate_distance


async def find_nearest_idle_ambulance(event_id: PydanticObjectId):
    """
    Find the nearest idle ambulance, compute ETA and path, and
    atomically mark it as ENROUTE with ETA and timestamp.
    """
    event = await Event.get(event_id)

    if not event:
        print(f"Event {event_id} not found.")
        return None, None, None
    event_lat = event.lat
    event_lng = event.lng

    ambulances = await Ambulance.find({"status": AmbulanceStatus.IDLE}).to_list()

    if not ambulances:
        print("No idle ambulances found.")
        return None, None, None

    best_ambulance = None
    best_eta = float("inf")
    best_path = None

    min = float("inf")

    # Find closes ambulace
    for amb in ambulances:
        distance = calculate_distance(event_lat, event_lng, amb.lat, amb.lng)
        if distance < min:
            min = distance
            best_ambulance = amb

    print(f"Closest ambulance is {best_ambulance.id} at distance {min} km")

    # Run API to find ETA and path for the closest ambulance
    try:
        eta, path = await compute_route_eta_and_path(
            best_ambulance.lat, best_ambulance.lng, event_lat, event_lng
        )
        if eta is not None and eta < best_eta:
            best_eta = eta
            best_path = path
    except Exception as e:
        print(f"Error computing route for best ambulance {best_ambulance.id}: {e}")

    if best_ambulance is None:
        return None, None, None

    # Atomically update the ambulance in MongoDB
    updated = await Ambulance.find_one(
        {"_id": best_ambulance.id, "status": AmbulanceStatus.IDLE}
    ).update(
        {
            "$set": {
                "status": AmbulanceStatus.ENROUTE,
                "event_id": event_id,
                "eta_seconds": best_eta,
                "updated_at": datetime.utcnow(),
            }
        }
    )

    if updated.matched_count == 0:
        # Another process grabbed it first
        print("Ambulance was already taken.")
        return None, None, None

    # Return the updated ambulance info, ETA, and path
    # Reload the ambulance document if you need all fields
    best_ambulance = await Ambulance.get(best_ambulance.id)
    return best_ambulance, best_eta, best_path


async def main():
    await init_db()
    # Example coordinates
    event_id = PydanticObjectId("696c06ed7b77d573b3d9d6d6")

    nearest_ambulance, eta, path = await find_nearest_idle_ambulance(event_id)

    if nearest_ambulance:
        print(f"Nearest ambulance: {nearest_ambulance.id}, ETA: {eta} seconds")
        print(f"Path is available with {len(path)} points.")
    else:
        print("No ambulance could be selected.")


if __name__ == "__main__":
    asyncio.run(main())
