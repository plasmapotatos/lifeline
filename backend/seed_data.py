"""Seed initial cameras, hospitals, and ambulances (wipes DB first)."""

from datetime import datetime
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
            "latest_frame_url": "http://localhost:5055/latest_frame",
            "name": "CAM_12",  # Camera 1 - port 5055
        },
        {
            "lat": base_lat + 0.0035,
            "lng": base_lng + 0.0027,
            "latest_frame_url": "http://localhost:5056/latest_frame",
            "name": "Astra-12",  # Camera 2 - port 5056 (matches start-all.ts)
        },
        {
            "lat": base_lat + -0.0034,
            "lng": base_lng + 0.0035,
            "latest_frame_url": "http://localhost:5057/latest_frame",
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
            "lat": base_lat + -0.0046,
            "lng": base_lng + 0.0104,
        },
        {
            "name": "Allegheny General Hospital",
            "lat": base_lat + 0.0160,
            "lng": base_lng + -0.0074,
        },
    ]

    hospitals = [Hospital(**hosp) for hosp in hospitals_data]
    await Hospital.insert_many(hospitals)

    event_location = Point(lat=base_lat + 0.0032, lng=base_lng + 0.0018)
    first_event = Event(
        severity=Severity.EMERGENCY,
        title="Auto-seeded event",
        description="Simulated emergency event for demo",
        reference_clip_url="http://localhost:5055/latest_clip.mp4",
        lat=event_location.lat,
        lng=event_location.lng,
        camera_id=cameras[0].id,
        status=EventStatus.OPEN,
        created_at=datetime.utcnow(),
    )
    await first_event.insert()

    # 🔹 Seed ambulances (one per hospital)
    ambulances = []
    for index, hospital in enumerate(hospitals_data):
        ambulance = Ambulance(
            lat=hospital["lat"] + 0.0001,
            lng=hospital["lng"] - 0.0002,
            status=AmbulanceStatus.IDLE,
            updated_at=datetime.utcnow(),
        )

        if index == 0:
            path_points = [
                Point(
                    lat=hospital["lat"]
                    + (event_location.lat - hospital["lat"]) * (step / 10),
                    lng=hospital["lng"]
                    + (event_location.lng - hospital["lng"]) * (step / 10),
                )
                for step in range(1, 11)
            ]
            ambulance.path = path_points
            ambulance.event_id = first_event.id

        ambulances.append(ambulance)
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
