"""Shared pytest fixtures. Wires mongomock into helpers.db_client and stubs the
VIZ RPC client so endpoint and helper code never touch real services."""
import os
import sys
from pathlib import Path
from unittest.mock import MagicMock

import mongomock
import pytest

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
    """Reset mongomock and inject it as the active client before every test."""
    from helpers import db_client

    client = mongomock.MongoClient()
    db_client.set_client(client, db_name=os.environ["DB_NAME"])
    yield client


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
