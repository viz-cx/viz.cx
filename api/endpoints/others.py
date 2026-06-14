from fastapi import APIRouter

from helpers.viz import get_client

router = APIRouter()


@router.get("/")
def home() -> dict:
    return get_client().info()
