"""emit_block_ops replays a saved block's ops to live subscribers."""
import datetime as dt

from helpers import op_stream, pubsub, webhooks
from helpers.viz import convertShares


def _txs():
    """Two ops as they sit on a saved block: timestamps are datetimes,
    shares ops carry a raw '<n> SHARES' string."""
    ts = dt.datetime(2026, 1, 1, tzinfo=dt.UTC)
    return [
        {"timestamp": ts, "op": ["transfer", {"from": "alice", "to": "bob"}]},
        {"timestamp": ts, "op": ["witness_reward", {"witness": "carol", "shares": "1.500000 SHARES"}]},
    ]


def test_emit_publishes_each_op_with_synthetic_id(monkeypatch):
    published = []
    monkeypatch.setattr(pubsub, "publish_op", published.append)
    monkeypatch.setattr(webhooks, "dispatch", lambda op: None)

    op_stream.emit_block_ops(42, _txs())

    assert [p["_id"] for p in published] == [
        42 + 1 / op_stream.COUNT_MAX_OPS_IN_BLOCK,
        42 + 2 / op_stream.COUNT_MAX_OPS_IN_BLOCK,
    ]
    assert published[0]["op"][0] == "transfer"


def test_emit_converts_shares_to_float(monkeypatch):
    published = []
    monkeypatch.setattr(pubsub, "publish_op", published.append)
    monkeypatch.setattr(webhooks, "dispatch", lambda op: None)

    op_stream.emit_block_ops(7, _txs())

    reward = published[1]
    assert reward["op"][1]["shares"] == convertShares("1.500000 SHARES")
    assert isinstance(reward["op"][1]["shares"], float)


def test_emit_dispatches_each_op_to_webhooks(monkeypatch):
    monkeypatch.setattr(pubsub, "publish_op", lambda op: None)
    dispatched = []
    monkeypatch.setattr(webhooks, "dispatch", dispatched.append)

    op_stream.emit_block_ops(1, _txs())

    assert len(dispatched) == 2
