"""WebSocket op stream.

    GET /ws/ops?op_type=transfer&account=alice

Each socket subscribes to live ops produced by *this* worker's sorter, filtered
server-side. See helpers.pubsub for the multi-worker scope caveat.
"""
from __future__ import annotations

import datetime as dt
import logging
from typing import Any

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from endpoints.accounts import ACCOUNT_FIELDS
from helpers import pubsub

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Subscriptions"])


def _serialize(op: dict[str, Any]) -> dict[str, Any]:
    ts = op.get("timestamp")
    if isinstance(ts, dt.datetime):
        ts = ts.isoformat()
    return {
        "op_id": op.get("_id"),
        "timestamp": ts,
        "op_type": op["op"][0] if "op" in op else None,
        "body": op["op"][1] if "op" in op and len(op["op"]) > 1 else {},
    }


def _build_filter(op_type: str | None, account: str | None):
    def matches(op: dict[str, Any]) -> bool:
        if op_type and op["op"][0] != op_type:
            return False
        if account:
            body = op["op"][1] if len(op["op"]) > 1 else {}
            for field in ACCOUNT_FIELDS:
                value = body.get(field)
                if value == account or (isinstance(value, list) and account in value):
                    return True
            return False
        return True

    return matches


@router.websocket("/ws/ops")
async def ws_ops(
    websocket: WebSocket,
    op_type: str | None = Query(default=None),
    account: str | None = Query(default=None),
) -> None:
    await websocket.accept()
    queue, unsubscribe = pubsub.subscribe(_build_filter(op_type, account))
    try:
        while True:
            op = await queue.get()
            await websocket.send_json(_serialize(op))
    except WebSocketDisconnect:
        pass
    finally:
        unsubscribe()
