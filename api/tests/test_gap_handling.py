"""Tests for handling a known hole in block history.

Blocks 79,105,831–80,463,600 are unobtainable (no reachable node serves
their op history), so the parser must be able to jump past the hole via
PARSER_START_BLOCK and the sorter must advance over _id ranges where no
block documents exist instead of re-querying the same empty window forever.
"""
import datetime as dt

from helpers import mongo
from parser.parser import resolve_start_block
from sorter.sorter import _sort_pass


def _seed_block(block_number: int) -> None:
    mongo.coll.insert_one(
        {
            "_id": block_number,
            "block": [
                {
                    "timestamp": dt.datetime(2026, 6, 1, tzinfo=dt.UTC),
                    "op": ["witness_reward", {"witness": "w", "shares": "1.000000 SHARES"}],
                }
            ],
        }
    )


def test_resolve_start_block_no_env(monkeypatch):
    monkeypatch.delenv("PARSER_START_BLOCK", raising=False)
    assert resolve_start_block(100) == 100


def test_resolve_start_block_jumps_ahead(monkeypatch):
    monkeypatch.setenv("PARSER_START_BLOCK", "500")
    assert resolve_start_block(100) == 499  # parser resumes at 500


def test_resolve_start_block_never_rewinds(monkeypatch):
    monkeypatch.setenv("PARSER_START_BLOCK", "50")
    assert resolve_start_block(100) == 100


def test_sort_pass_advances_over_empty_window():
    _seed_block(1)
    _seed_block(5000)
    pos = _sort_pass(0, 5000)
    assert pos > 1  # window upper, not the last found block
    for _ in range(1000):
        if pos >= 5000:
            break
        pos = _sort_pass(pos, 5000)
    assert pos == 5000
    sorted_ids = [d["_id"] for d in mongo.coll_ops["witness_reward"].find({})]
    assert any(4999 < i < 5001 for i in sorted_ids)
    assert any(0 < i < 2 for i in sorted_ids)
