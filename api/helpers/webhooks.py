"""Webhook registry and signed delivery.

Storage (`coll_webhooks`):
    _id: ObjectId
    account: str          owner (signed-request authenticated)
    url: str              POST target
    filter: dict          {op_type?, account?}
    secret: str           HMAC-SHA256 key (returned once on creation)
    created_at: datetime
    active: bool

Delivery from the sorter thread is fire-and-forget on a ThreadPoolExecutor.
Each POST is signed with header `X-Viz-Signature: sha256=<hex>` over the body.
Retries: 3 attempts, exponential backoff (1s, 2s, 4s). On exhaustion the call
is logged and dropped; the webhook stays active for future ops.

The active-webhooks list is cached in-memory so dispatch() doesn't hit Mongo
per op. The cache is invalidated explicitly on register/deactivate (covers
the single-worker deployment that pubsub.py already documents) and refreshed
on a TTL fallback for multi-worker setups where register may land in a
different process than the sorter.
"""
from __future__ import annotations

import datetime as dt
import hashlib
import hmac
import json
import logging
import os
import secrets
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from typing import Any

import httpx
from bson import ObjectId

from helpers.db_client import get_db
from helpers.pubsub import ACCOUNT_FIELDS

logger = logging.getLogger(__name__)

SIGNATURE_HEADER = "X-Viz-Signature"
USER_AGENT = "viz.cx-webhook/1"
DELIVERY_TIMEOUT = 10.0
MAX_ATTEMPTS = 3

_executor: ThreadPoolExecutor | None = None

_cache_lock = threading.Lock()
_cache: list[dict[str, Any]] | None = None
_cache_expires_at: float = 0.0


def _cache_ttl() -> float:
    return float(os.getenv("WEBHOOK_CACHE_TTL", "5.0"))


def _invalidate_cache() -> None:
    global _cache, _cache_expires_at
    with _cache_lock:
        _cache = None
        _cache_expires_at = 0.0


def _active_webhooks() -> list[dict[str, Any]]:
    global _cache, _cache_expires_at
    now = time.monotonic()
    with _cache_lock:
        if _cache is not None and now < _cache_expires_at:
            return _cache
    try:
        fresh = list(_coll().find({"active": True}))
    except Exception:
        logger.exception("Webhook registry read failed")
        return []
    with _cache_lock:
        _cache = fresh
        _cache_expires_at = time.monotonic() + _cache_ttl()
    return fresh


def _coll():
    name = os.getenv("COLLECTION_WEBHOOKS", "webhooks")
    return get_db()[name]


def ensure_indexes() -> None:
    coll = _coll()
    coll.create_index([("account", 1)])
    coll.create_index([("active", 1), ("filter.op_type", 1)])


def _executor_singleton() -> ThreadPoolExecutor:
    global _executor
    if _executor is None:
        max_workers = int(os.getenv("WEBHOOK_WORKERS", "4"))
        _executor = ThreadPoolExecutor(
            max_workers=max_workers, thread_name_prefix="webhook"
        )
    return _executor


def register(account: str, url: str, op_type: str | None, target_account: str | None) -> dict[str, str]:
    secret = secrets.token_urlsafe(32)
    doc = {
        "account": account,
        "url": url,
        "filter": {"op_type": op_type, "account": target_account},
        "secret": secret,
        "created_at": dt.datetime.now(dt.UTC),
        "active": True,
    }
    result = _coll().insert_one(doc)
    _invalidate_cache()
    return {"id": str(result.inserted_id), "secret": secret}


def deactivate(webhook_id: str, account: str) -> bool:
    result = _coll().delete_one({"_id": ObjectId(webhook_id), "account": account})
    if result.deleted_count == 1:
        _invalidate_cache()
        return True
    return False


def list_for(account: str) -> list[dict[str, Any]]:
    cursor = _coll().find({"account": account}, {"secret": 0})
    out = []
    for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        out.append(doc)
    return out


def _matches(filt: dict[str, Any], op: dict[str, Any]) -> bool:
    op_type_f = filt.get("op_type")
    account_f = filt.get("account")
    if op_type_f and op["op"][0] != op_type_f:
        return False
    if account_f:
        body = op["op"][1] if len(op["op"]) > 1 else {}
        for field in ACCOUNT_FIELDS:
            value = body.get(field)
            if value == account_f or (isinstance(value, list) and account_f in value):
                return True
        return False
    return True


def _serialize(op: dict[str, Any]) -> dict[str, Any]:
    ts = op.get("timestamp")
    if isinstance(ts, dt.datetime):
        ts = ts.isoformat()
    return {
        "op_id": op.get("_id"),
        "timestamp": ts,
        "op_type": op["op"][0],
        "body": op["op"][1] if len(op["op"]) > 1 else {},
    }


def _sign(secret: str, payload: bytes) -> str:
    digest = hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()
    return f"sha256={digest}"


def _deliver(url: str, secret: str, payload: dict[str, Any]) -> None:
    body = json.dumps(payload, default=str).encode("utf-8")
    headers = {
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
        SIGNATURE_HEADER: _sign(secret, body),
    }
    for attempt in range(MAX_ATTEMPTS):
        try:
            response = httpx.post(url, content=body, headers=headers, timeout=DELIVERY_TIMEOUT)
            if response.status_code < 500:
                return
        except Exception as exc:
            logger.info("Webhook delivery failed (attempt %d): %s", attempt + 1, exc)
        if attempt < MAX_ATTEMPTS - 1:
            time.sleep(2 ** attempt)
    logger.warning("Webhook delivery exhausted: url=%s", url)


def dispatch(op: dict[str, Any]) -> None:
    """Match the op against active webhooks and queue HTTP deliveries.
    Called from the sorter thread; never blocks. The active-webhooks list
    is served from an in-memory cache to avoid a Mongo round trip per op."""
    candidates = _active_webhooks()
    if not candidates:
        return
    payload = _serialize(op)
    pool = _executor_singleton()
    for wh in candidates:
        if not _matches(wh.get("filter", {}) or {}, op):
            continue
        pool.submit(_deliver, wh["url"], wh["secret"], payload)
