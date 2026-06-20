from fastapi import APIRouter

from helpers.db_client import get_async_db
from helpers.richlist_snapshot import COLLECTION, SNAPSHOT_ID

router = APIRouter(
    prefix="/richlist",
    tags=["Richlist"],
)


@router.get("")
async def richlist() -> dict:
    """Latest cached richlist snapshot.

    Returns the top accounts ranked by total holdings, each with liquid,
    capital, and effective figures so the client can re-sort. `updated_at` is
    null until the background worker has built the first snapshot.
    """
    doc = await get_async_db()[COLLECTION].find_one({"_id": SNAPSHOT_ID})
    if not doc:
        return {"updated_at": None, "count": 0, "accounts": []}
    doc.pop("_id", None)
    return doc
