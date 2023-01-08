import helpers.mongo as mongo
from fastapi import APIRouter


router = APIRouter(
    prefix="/blocks",
    tags=["Blocks"],
    responses={404: {"description": "Not found"}},
)


@router.get("/block")
def block(id: int = 1) -> dict:
    return mongo.get_block(id)


@router.get("/latest")
def latest() -> dict:
    return mongo.get_last_block()
