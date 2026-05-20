from fastapi import APIRouter

import helpers.mongo as mongo

router = APIRouter(
    prefix="/blocks",
    tags=["Blocks"],
    responses={404: {"description": "Not found"}},
)


@router.get("/latest")
async def latest() -> dict:
    return await mongo.aget_last_block()


@router.get("/{id}")
async def block(id: int) -> dict:
    return await mongo.aget_block(id)
