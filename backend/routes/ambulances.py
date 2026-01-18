from fastapi import APIRouter, HTTPException
from typing import List

from models import Ambulance
from utils.ambulance import simulate_ambulance

router = APIRouter(prefix="/ambulances", tags=["Ambulances"])


@router.get("", response_model=List[Ambulance])
async def get_ambulances():
    """Get all ambulances."""
    ambulances = await Ambulance.find_all().to_list()
    return ambulances


@router.post("/{ambulance_id}/simulate")
async def simulate_ambulance_route(ambulance_id: str):
    ambulance = await Ambulance.get(ambulance_id)
    if not ambulance:
        raise HTTPException(status_code=404, detail="Ambulance not found")

    await simulate_ambulance(ambulance.id)
    return {"ok": True, "ambulance_id": str(ambulance.id)}
