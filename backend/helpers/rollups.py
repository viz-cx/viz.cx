"""Hourly rollups for fast op-count and shares-sum queries.

Schema (`coll_rollups`):
    _id: "<iso_hour>|<op_type>"   composite ID for idempotent upserts
    hour: datetime               truncated to hour (UTC)
    op_type: str
    count: int                   number of ops of this type in this hour
    shares: float                sum of op.shares (0.0 for non-shares ops)

Reads (count_in_period / shares_in_period) are point-range queries on `hour`.
Writes happen incrementally from the sorter as new blocks arrive, and via the
backfill CLI for historical catch-up.
"""
from __future__ import annotations

import datetime as dt
import os
from collections import defaultdict
from typing import Any

from helpers.db_client import get_db
from helpers.enums import ops_shares


def _coll():
    name = os.getenv("COLLECTION_ROLLUPS", "rollups")
    return get_db()[name]


def ensure_indexes() -> None:
    coll = _coll()
    coll.create_index([("hour", 1), ("op_type", 1)])
    coll.create_index([("op_type", 1), ("hour", 1)])


def _hour_bucket(ts: dt.datetime) -> dt.datetime:
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=dt.UTC)
    return ts.replace(minute=0, second=0, microsecond=0, tzinfo=dt.UTC)


def _hour_ceil(ts: dt.datetime) -> dt.datetime:
    """Round up to the next hour boundary; pass through if already on one."""
    bucket = _hour_bucket(ts)
    return bucket if ts == bucket else bucket + dt.timedelta(hours=1)


def _doc_id(hour: dt.datetime, op_type: str) -> str:
    return f"{hour.isoformat()}|{op_type}"


def _delta_from_op(op: dict[str, Any]) -> tuple[str, float]:
    op_type = op["op"][0]
    shares = float(op["op"][1].get("shares", 0.0) or 0.0) if op_type in ops_shares else 0.0
    return op_type, shares


def aggregate_ops(ops: list[dict[str, Any]]) -> None:
    """Apply rollup deltas for a list of ops (with timestamp). Batched per
    (hour, op_type) to minimize round trips."""
    if not ops:
        return
    deltas: dict[tuple[dt.datetime, str], dict[str, float]] = defaultdict(
        lambda: {"count": 0, "shares": 0.0}
    )
    for op in ops:
        ts = op["timestamp"]
        if isinstance(ts, str):
            ts = dt.datetime.fromisoformat(ts)
        hour = _hour_bucket(ts)
        op_type, shares = _delta_from_op(op)
        bucket = deltas[(hour, op_type)]
        bucket["count"] += 1
        bucket["shares"] += shares

    coll = _coll()
    for (hour, op_type), delta in deltas.items():
        coll.update_one(
            {"_id": _doc_id(hour, op_type)},
            {
                "$inc": {"count": int(delta["count"]), "shares": float(delta["shares"])},
                "$setOnInsert": {"hour": hour, "op_type": op_type},
            },
            upsert=True,
        )


def _range_filter(
    op_type: str | None,
    from_date: dt.datetime | None,
    to_date: dt.datetime | None,
) -> dict[str, Any]:
    q: dict[str, Any] = {}
    if op_type:
        q["op_type"] = op_type
    if from_date or to_date:
        bounds: dict[str, dt.datetime] = {}
        if from_date:
            bounds["$gte"] = _hour_bucket(from_date)
        if to_date:
            bounds["$lt"] = _hour_ceil(to_date)
        q["hour"] = bounds
    return q


def get_count(
    op_type: str | None = None,
    from_date: dt.datetime | None = None,
    to_date: dt.datetime | None = None,
) -> int:
    pipeline = [
        {"$match": _range_filter(op_type, from_date, to_date)},
        {"$group": {"_id": None, "total": {"$sum": "$count"}}},
    ]
    result = list(_coll().aggregate(pipeline))
    return int(result[0]["total"]) if result else 0


def get_shares_sum(
    op_type: str | None = None,
    from_date: dt.datetime | None = None,
    to_date: dt.datetime | None = None,
) -> float:
    pipeline = [
        {"$match": _range_filter(op_type, from_date, to_date)},
        {"$group": {"_id": None, "total": {"$sum": "$shares"}}},
    ]
    result = list(_coll().aggregate(pipeline))
    return float(result[0]["total"]) if result else 0.0


def get_series(
    op_type: str | None = None,
    from_date: dt.datetime | None = None,
    to_date: dt.datetime | None = None,
) -> list[dict[str, Any]]:
    """Return per-hour series rows: [{hour, op_type, count, shares}, ...]."""
    cursor = (
        _coll()
        .find(_range_filter(op_type, from_date, to_date), {"_id": 0})
        .sort([("hour", 1), ("op_type", 1)])
    )
    return list(cursor)
