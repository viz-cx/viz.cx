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
    from helpers.enums import OpType, ops_custom, ops_shares

    coll_ops_name = os.getenv("COLLECTION_OPS", "")
    if coll_ops_name:
        coll_ops = db[coll_ops_name]
        for op_type in ops_custom + ops_shares:
            coll_ops[str(op_type)].create_index([("timestamp", -1)])
        coll_ops[str(OpType.receive_award)].create_index(
            [("timestamp", -1), ("op.memo", 1)]
        )

    coll_posts = db[os.getenv("COLLECTION_POSTS", "posts")]
    coll_posts.create_index([("d.r", 1)])
    coll_posts.create_index([("author", 1), ("block", 1)])
    coll_posts.create_index([("block", -1)])
    coll_posts.create_index([("shares", -1)])

    rollups.ensure_indexes()
    signature_auth.ensure_nonce_indexes()
    webhooks.ensure_indexes()
    _indexes_ensured = True
