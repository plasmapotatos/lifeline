import os
from datetime import datetime
from dotenv import load_dotenv
import httpx
import polyline  # pip install polyline

load_dotenv()

API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

URL = "https://routes.googleapis.com/directions/v2:computeRoutes"

# Updated FieldMask to include polyline and removed trailing comma
HEADERS = {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": API_KEY,
    "X-Goog-FieldMask": "routes.duration,routes.polyline.encodedPolyline",
}


async def compute_route_eta_and_path(
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
) -> tuple[int | None, list[tuple[float, float]] | None]:
    """
    Returns:
        eta_seconds: int or None
        path: list of (lat, lng) points from origin to destination, or None on failure
    """

    body = {
        "origin": {
            "location": {"latLng": {"latitude": origin_lat, "longitude": origin_lng}}
        },
        "destination": {
            "location": {"latLng": {"latitude": dest_lat, "longitude": dest_lng}}
        },
        "travelMode": "DRIVE",
        "routingPreference": "TRAFFIC_AWARE",
        "departureTime": datetime.utcnow().isoformat() + "Z",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(URL, headers=HEADERS, json=body)
            response.raise_for_status()
            data = response.json()

        routes = data.get("routes")
        if not routes:
            return None, None

        route = routes[0]

        # Extract ETA in seconds
        duration_str = route.get("duration")  # e.g., "345s"
        eta_seconds = int(duration_str.rstrip("s")) if duration_str else None

        # Extract path points
        encoded_polyline = route.get("polyline", {}).get("encodedPolyline")
        path = polyline.decode(encoded_polyline) if encoded_polyline else None

        return eta_seconds, path

    except Exception as e:
        print(f"Error calling Routes API: {e}")
        return None, None
