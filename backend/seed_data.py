"""Seed initial cameras, hospitals, and ambulances (wipes DB first)."""

from datetime import datetime, timedelta
import logging
import os

from database import init_db
from models import (
    Ambulance,
    AmbulanceStatus,
    Camera,
    Event,
    EventStatus,
    Hospital,
    Severity,
)
from schemas import Point
from motor.motor_asyncio import AsyncIOMotorClient

import certifi

MONGODB_CONNECTION_STRING = os.getenv(
    "MONGODB_CONNECTION_STRING",
    "mongodb+srv://owenchend_db_user:kU2F1onGsj12M0LH@cluster0.ec2quxk.mongodb.net/?appName=Cluster0&retryWrites=true&w=majority",
)
MONGODB_DATABASE_NAME = os.getenv("MONGODB_DATABASE_NAME", "lifeline")

logger = logging.getLogger(__name__)


async def seed_data():
    """Wipe and seed cameras, hospitals, and ambulances."""
    await init_db()

    # 🔹 Drop existing collections
    logger.info("🗑️ Dropping existing collections...")

    client = AsyncIOMotorClient(
        MONGODB_CONNECTION_STRING,
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=30000,  # 30 seconds
        connectTimeoutMS=30000,
        socketTimeoutMS=30000,
    )

    db = client[MONGODB_DATABASE_NAME]
    await db.drop_collection("cameras")
    await db.drop_collection("events")
    await db.drop_collection("hospitals")
    await db.drop_collection("ambulances")

    logger.info("✅ Collections dropped, seeding data...")

    # 🔹 Seed cameras (3 cameras for Overshoot integration)
    base_lat = 40.44089893147938
    base_lng = -79.94277710160165

    cameras_data = [
        {
            "lat": base_lat + 0.0000,
            "lng": base_lng + -0.0000,
            "url": "http://localhost:5055",
            "name": "CAM_12",  # Camera 1 - port 5055
        },
        {
            "lat": base_lat + 0.0035,
            "lng": base_lng + 0.0027,
            "url": "http://localhost:5056",
            "name": "Astra-12",  # Camera 2 - port 5056 (matches start-all.ts)
        },
        {
            "lat": base_lat + -0.0034,
            "lng": base_lng + 0.0035,
            "url": "http://localhost:5057",
            "name": "Astra-18",  # Camera 3 - port 5057 (Astra cameras use hyphens)
        },
    ]

    cameras = [Camera(**cam) for cam in cameras_data]
    await Camera.insert_many(cameras)

    # 🔹 Seed hospitals
    hospitals_data = [
        {
            "name": "UPMC Presbyterian",
            "lat": base_lat + 0.0015,
            "lng": base_lng + 0.0357,
        },
        {
            "name": "UPMC Mercy",
            "lat": base_lat + -0.0062,
            "lng": base_lng + 0.0104,
        },
        {
            "name": "Allegheny General Hospital",
            "lat": base_lat + 0.0180,
            "lng": base_lng + -0.0074,
        },
    ]

    hospitals = [Hospital(**hosp) for hosp in hospitals_data]
    await Hospital.insert_many(hospitals)

    now = datetime.utcnow()

    events_data = [
        # Camera 1 - 1 event
        {
            "camera": cameras[0],
            "severity": Severity.INFORMATIONAL,
            "title": "Loose trash on street",
            "description": "Minor debris observed, no hazard.",
            "created_at": now - timedelta(hours=2),
        },
        # Camera 2 - 2 events
        {
            "camera": cameras[1],
            "severity": Severity.EMERGENCY,
            "title": "Person fell on sidewalk",
            "description": "Immediate attention needed, potential injury.",
            "created_at": now - timedelta(hours=1, minutes=30),
        },
        {
            "camera": cameras[1],
            "severity": Severity.INFORMATIONAL,
            "title": "Car parked illegally",
            "description": "Reported for city authorities.",
            "created_at": now - timedelta(hours=1, minutes=15),
        },
        # Camera 3 - 3 events
        {
            "camera": cameras[2],
            "severity": Severity.INFORMATIONAL,
            "title": "Street litter noticed",
            "description": "Routine observation.",
            "created_at": now - timedelta(hours=1),
        },
        {
            "camera": cameras[2],
            "severity": Severity.EMERGENCY,
            "title": "Bicycle accident",
            "description": "Cyclist down, requires assistance.",
            "created_at": now - timedelta(minutes=45),
        },
        {
            "camera": cameras[2],
            "severity": Severity.INFORMATIONAL,
            "title": "Pedestrian crossing safely",
            "description": "No emergency.",
            "created_at": now - timedelta(minutes=30),
        },
    ]

    # 🔹 Additional unresolved informational events (health-related)
    events = []
    health_events_data = [
        {
            "camera": cameras[0],
            "severity": Severity.INFORMATIONAL,
            "title": "Person stretching in park",
            "description": "Observed person doing light exercise, no medical attention needed.",
            "created_at": now - timedelta(minutes=20),
        },
        {
            "camera": cameras[1],
            "severity": Severity.INFORMATIONAL,
            "title": "Elderly individual walking slowly",
            "description": "No distress observed, monitoring for safety.",
            "created_at": now - timedelta(minutes=15),
        },
        {
            "camera": cameras[2],
            "severity": Severity.INFORMATIONAL,
            "title": "Jogger taking break",
            "description": "Routine observation, no emergency.",
            "created_at": now - timedelta(minutes=10),
        },
    ]

    for e in health_events_data:
        event = Event(
            severity=e["severity"],
            title=e["title"],
            description=e["description"],
            reference_clip_url=f"{e['camera'].url}/latest_clip.mp4",
            lat=e["camera"].lat + 0.0003,
            lng=e["camera"].lng + 0.0003,
            camera_name=e["camera"].name,
            status=EventStatus.OPEN,  # Unresolved
            created_at=e["created_at"],
            resolved_at=None,
        )
        events.append(event)

    for e in events_data:
        resolved_at = e["created_at"] + timedelta(minutes=30)
        event = Event(
            severity=e["severity"],
            title=e["title"],
            description=e["description"],
            reference_clip_url=f"{e['camera'].url}/latest_clip.mp4",
            lat=e["camera"].lat + 0.0005,
            lng=e["camera"].lng + 0.0005,
            camera_name=e["camera"].name,
            status=EventStatus.RESOLVED,
            created_at=e["created_at"],
            resolved_at=resolved_at,
        )
        events.append(event)

    await Event.insert_many(events)

    logger.info(f"✅ Seeded {len(events_data)} resolved + 3 unresolved health events")

    # 🔹 Seed ambulances (one per hospital)
    ambulances = [
        Ambulance(
            lat=hospitals_data[0]["lat"] + 0.0010,
            lng=hospitals_data[0]["lng"] + 0.0010,
            name="Presbyterian 1",
            status=AmbulanceStatus.IDLE,
            updated_at=datetime.utcnow(),
        ),
        Ambulance(
            lat=hospitals_data[1]["lat"] + 0.0010,
            lng=hospitals_data[1]["lng"] + 0.0010,
            name="Mercy 12",
            status=AmbulanceStatus.IDLE,
            updated_at=datetime.utcnow(),
        ),
        Ambulance(
            lat=hospitals_data[2]["lat"] + 0.0010,
            lng=hospitals_data[2]["lng"] + 0.0010,
            name="Allegheny 42",
            status=AmbulanceStatus.IDLE,
            updated_at=datetime.utcnow(),
        ),
    ]
    await Ambulance.insert_many(ambulances)

    logger.info(
        f"✅ Seeded {len(cameras_data)} cameras, {len(hospitals_data)} hospitals, "
        f"and {len(hospitals_data)} ambulances"
    )


if __name__ == "__main__":
    import asyncio
    import logging

    logging.basicConfig(level=logging.INFO)
    asyncio.run(seed_data())
