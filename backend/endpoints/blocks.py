from fastapi import APIRouter

import helpers.mongo as mongo

router = APIRouter(
    prefix="/blocks",
    tags=["Blocks"],
    responses={404: {"description": "Not found"}},
)


@router.get("/latest")
def latest() -> dict:
    return mongo.get_last_block()


@router.get("/{id}")
def block(id: int) -> dict:
    return mongo.get_block(id)
