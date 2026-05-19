from helpers.db_client import get_db
from scripts.backfill_sorted_ops import backfill


def _insert_block(blocknum: int):
    db = get_db()
    db["blocks"].insert_one({
        "_id": blocknum,
        "block": [
            {
                "op": ["witness_reward", {"shares": "10.000 SHARES"}],
                "timestamp": "2026-05-20T00:00:00",
            },
        ],
    })


def test_backfill_processes_blocks():
    for i in range(1, 6):
        _insert_block(i)

    backfill(from_block=1, to_block=5, batch=2)

    db = get_db()
    sorted_count = db["ops"]["witness_reward"].count_documents({})
    assert sorted_count == 5


def test_backfill_noop_when_range_empty():
    backfill(from_block=100, to_block=50, batch=10)
    db = get_db()
    assert db["ops"]["witness_reward"].count_documents({}) == 0
