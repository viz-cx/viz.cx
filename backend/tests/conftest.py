"""Shared pytest fixtures. Wires mongomock into helpers.db_client and stubs the
VIZ RPC client so endpoint and helper code never touch real services."""
import os
import sys
from pathlib import Path
from unittest.mock import MagicMock

import pytest
from mongomock_motor import AsyncMongoMockClient

os.environ["SKIP_WORKERS"] = "1"
os.environ.setdefault("DB_NAME", "viztest")
os.environ.setdefault("COLLECTION", "blocks")
os.environ.setdefault("COLLECTION_OPS", "ops")
os.environ.setdefault("COLLECTION_POSTS", "posts")

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


@pytest.fixture(autouse=True)
def _mongo(monkeypatch):
    """Reset mongomock and inject it as the active client before every test.
    One AsyncMongoMockClient backs both views — its internal sync mongomock
    client is used for the sync helpers, so test seeding via either client
    sees the same data."""
    from helpers import db_client

    async_client = AsyncMongoMockClient()
    sync_client = async_client._AsyncMongoMockClient__client
    db_client.set_client(sync_client, db_name=os.environ["DB_NAME"])
    db_client.set_async_client(async_client, db_name=os.environ["DB_NAME"])
    yield sync_client


@pytest.fixture(autouse=True)
def _viz(monkeypatch):
    """Replace the VIZ client with a MagicMock so no network is touched."""
    from helpers import viz as viz_module

    fake = MagicMock()
    fake.rpc.get_dynamic_global_properties.return_value = {
        "last_irreversible_block_num": 100,
    }
    fake.info.return_value = {"chain_id": "test"}
    monkeypatch.setattr(viz_module, "viz", fake)
    monkeypatch.setattr(viz_module, "init_node", lambda *a, **k: None)
    yield fake


@pytest.fixture
def client(monkeypatch):
    """FastAPI TestClient with workers skipped and lifespan invoked."""
    from fastapi.testclient import TestClient

    import main

    with TestClient(main.app) as c:
        yield c
