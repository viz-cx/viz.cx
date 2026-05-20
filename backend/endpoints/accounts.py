"""Per-account operation history across all op subcollections.

Returns operations involving a given account in any well-known role (sender,
receiver, witness, benefactor, custom-auth signer). Supports filters by
op_type and counterparty, and cursor-based pagination.

Example:
    GET /accounts/alice/history?op_type=transfer&limit=50
    GET /accounts/alice/history?cursor=<from-prev-response>
"""
from __future__ import annotations

import base64
import datetime as dt
import json
import os
from concurrent.futures import ThreadPoolExecutor
from typing import Any

import pymongo
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from helpers import mongo

_history_executor: ThreadPoolExecutor | None = None


def _executor() -> ThreadPoolExecutor:
    global _history_executor
    if _history_executor is None:
        max_workers = int(os.getenv("HISTORY_FANOUT_WORKERS", "5"))
        _history_executor = ThreadPoolExecutor(
            max_workers=max_workers, thread_name_prefix="history"
        )
    return _history_executor

router = APIRouter(
    prefix="/accounts",
    tags=["Accounts"],
    responses={404: {"description": "Not found"}},
)


ACCOUNT_FIELDS = [
    "from",
    "to",
    "receiver",
    "account",
    "benefactor",
    "witness",
    "beneficiaries.account",
    "required_active_auths",
    "required_regular_auths",
    "required_posting_auths",
]


class OperationRow(BaseModel):
    op_id: float
    op_type: str
    timestamp: dt.datetime
    body: dict[str, Any]


class HistoryResponse(BaseModel):
    account: str
    op_type: str | None = None
    counterparty: str | None = None
    items: list[OperationRow]
    next_cursor: str | None = None


def _account_or(account: str, counterparty: str | None = None) -> dict[str, Any]:
    """Build the $or query matching either the account or the counterparty
    (or both) against any well-known role field. Counterparty is the secondary
    filter: results must involve both."""
    or_account = [{f"op.1.{f}": account} for f in ACCOUNT_FIELDS]
    if counterparty:
        or_counter = [{f"op.1.{f}": counterparty} for f in ACCOUNT_FIELDS]
        return {"$and": [{"$or": or_account}, {"$or": or_counter}]}
    return {"$or": or_account}


def _encode_cursor(timestamp: dt.datetime, op_id: float) -> str:
    payload = json.dumps({"t": timestamp.isoformat(), "i": op_id})
    return base64.urlsafe_b64encode(payload.encode("utf-8")).decode("ascii")


def _decode_cursor(cursor: str) -> tuple[dt.datetime, float]:
    try:
        payload = json.loads(base64.urlsafe_b64decode(cursor.encode("ascii")))
        return dt.datetime.fromisoformat(payload["t"]), float(payload["i"])
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid cursor") from exc


def _collections_for(op_type: str | None):
    """Yield (collection, op_type_label) pairs to query for this filter."""
    sorted_types = {str(t) for t in mongo.sorted_op_types}
    if op_type is None:
        for t in sorted_types:
            yield mongo.coll_ops[t], t
        yield mongo.coll_ops, None
    elif op_type in sorted_types:
        yield mongo.coll_ops[op_type], op_type
    else:
        yield mongo.coll_ops, op_type


@router.get("/{account}/history", response_model=HistoryResponse)
def account_history(
    account: str,
    op_type: str | None = Query(default=None),
    counterparty: str | None = Query(default=None),
    cursor: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
) -> HistoryResponse:
    base_filter = _account_or(account, counterparty)
    if op_type is not None and op_type not in {str(t) for t in mongo.sorted_op_types}:
        # For unsorted ops collection, restrict by op type.
        base_filter = {"$and": [base_filter, {"op.0": op_type}]}

    if cursor:
        cur_ts, cur_id = _decode_cursor(cursor)
        cursor_clause = {
            "$or": [
                {"timestamp": {"$lt": cur_ts}},
                {"timestamp": cur_ts, "_id": {"$lt": cur_id}},
            ]
        }
        base_filter = {"$and": [base_filter, cursor_clause]}

    # Query each candidate collection in parallel, then merge sort by
    # (timestamp, _id) desc. Independent reads — pymongo connections are
    # thread-safe — so fan-out wall time is ~max(per-coll) instead of sum.
    overfetch = limit + 1

    def _fetch(coll, label):
        rows = list(
            coll.find(base_filter)
            .sort([("timestamp", pymongo.DESCENDING), ("_id", pymongo.DESCENDING)])
            .limit(overfetch)
        )
        for row in rows:
            row.setdefault("op_type_label", label or row.get("op", [None])[0])
        return rows

    sources = list(_collections_for(op_type))
    if len(sources) > 1:
        futures = [_executor().submit(_fetch, c, lbl) for c, lbl in sources]
        candidates: list[dict[str, Any]] = [r for fut in futures for r in fut.result()]
    else:
        coll, label = sources[0]
        candidates = _fetch(coll, label)

    candidates.sort(
        key=lambda r: (r["timestamp"], r["_id"]), reverse=True
    )
    page = candidates[:limit]
    has_more = len(candidates) > limit

    items = [
        OperationRow(
            op_id=r["_id"],
            op_type=r.get("op_type_label") or r["op"][0],
            timestamp=r["timestamp"],
            body=r["op"][1] if len(r["op"]) > 1 else {},
        )
        for r in page
    ]

    next_cursor = None
    if has_more and page:
        last = page[-1]
        next_cursor = _encode_cursor(last["timestamp"], last["_id"])

    return HistoryResponse(
        account=account,
        op_type=op_type,
        counterparty=counterparty,
        items=items,
        next_cursor=next_cursor,
    )
