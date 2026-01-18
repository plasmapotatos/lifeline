from fastapi import APIRouter

router = APIRouter(tags=["Root"])


@router.get("/")
async def read_root():
    return {"message": "Welcome to Lifeline API!"}
