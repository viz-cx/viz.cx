import helpers.mongo as mongo
from fastapi import APIRouter


router = APIRouter(
    prefix="/profile",
    tags=["Profile"],
    responses={404: {"description": "Not found"}},
)


@router.get("/{user}")
def profile(user: str):
    return mongo.get_user_metadata(user=user)
