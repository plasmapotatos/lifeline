import asyncio
from bson import ObjectId
from main import init_db
from models import Ambulance, AmbulanceStatus
from schemas import Point


async def main():
	await init_db()

	ambulance = Ambulance(
		location=Point(lat=40.7484, lng=-73.9857),
		event_id=ObjectId(),
		is_resolved=False,
		eta_seconds=420,
		status=AmbulanceStatus.GOING,
		path=[Point(lat=40.7484, lng=-73.9857), Point(lat=40.749, lng=-73.984)],
	)

	await ambulance.insert()
	print(f"Inserted ambulance with id: {ambulance.id}")


if __name__ == "__main__":
	asyncio.run(main())
