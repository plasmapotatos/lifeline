from fastapi import APIRouter
from typing import List

from models import Hospital

router = APIRouter(prefix="/hospitals", tags=["Hospitals"])


@router.get("", response_model=List[Hospital])
async def get_hospitals():
    """Get all hospitals."""
    hospitals = await Hospital.find_all().to_list()
    return hospitals
