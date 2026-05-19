"""Lazy MongoDB client. Tests can swap the client before first access."""
import os
from typing import Any

import pymongo

_client: Any = None
_db: Any = None
_indexes_ensured = False


def set_client(client: Any, db_name: str | None = None) -> None:
    """Override the active client (used in tests). Also clears any in-memory
    caches keyed off the previous client (e.g. the webhook registry cache)
    so tests don't bleed state across each other."""
    global _client, _db, _indexes_ensured
    _client = client
    _db = client[db_name or os.getenv("DB_NAME", "")]
    _indexes_ensured = False

    from helpers import webhooks
    webhooks._invalidate_cache()


def get_db() -> Any:
    global _client, _db
    if _db is None:
        _client = pymongo.MongoClient(os.getenv("MONGO", ""))
        _db = _client[os.getenv("DB_NAME", "")]
    return _db


def ensure_indexes() -> None:
    """Create indexes on first call. Idempotent."""
    global _indexes_ensured
    if _indexes_ensured:
        return
    db = get_db()
    coll = db[os.getenv("COLLECTION", "")]
    coll.create_index([("_id", 1), ("block.op.0", 1), ("block.op.1.id", 1)])

    from helpers import rollups, signature_auth, webhooks

    rollups.ensure_indexes()
    signature_auth.ensure_nonce_indexes()
    webhooks.ensure_indexes()
    _indexes_ensured = True
