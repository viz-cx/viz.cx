"""Real-time head-block emission: flatten_block + start_live_stream."""
import pytest

from parser import live_stream


def test_flatten_block_applies_block_timestamp_to_each_op():
    block = {
        "timestamp": "2026-01-01T00:00:00",
        "transactions": [
            {"operations": [["transfer", {"from": "a"}], ["award", {"x": 1}]]},
            {"operations": [["custom", {}]]},
        ],
    }
    txs = live_stream.flatten_block(block)
    assert [t["op"][0] for t in txs] == ["transfer", "award", "custom"]
    assert all(t["timestamp"] == "2026-01-01T00:00:00" for t in txs)


def test_flatten_block_handles_empty():
    assert live_stream.flatten_block({"transactions": []}) == []
    assert live_stream.flatten_block({}) == []


def test_start_live_stream_emits_only_new_head_blocks(monkeypatch):
    """On boot it starts at the current head (no history replay) and emits each
    new block's real ops exactly once."""
    head_calls = {"n": 0}

    def fake_head():
        head_calls["n"] += 1
        if head_calls["n"] > 1:
            raise KeyboardInterrupt  # break the infinite loop after one pass
        return 100

    blocks = {
        100: {
            "timestamp": "2026-01-01T00:00:00",
            "transactions": [{"operations": [["transfer", {"from": "a", "to": "b"}]]}],
        }
    }
    emitted = []
    monkeypatch.setattr(live_stream, "get_head_block_num", fake_head)
    monkeypatch.setattr(live_stream, "get_block", lambda n: blocks.get(n))
    monkeypatch.setattr(live_stream, "emit_block_ops", lambda n, txs: emitted.append((n, txs)))
    monkeypatch.setattr(live_stream, "sleep", lambda _s: None)

    with pytest.raises(KeyboardInterrupt):
        live_stream.start_live_stream()

    # head=100 with last_emitted seeded to 99 → only block 100 is emitted.
    assert [n for n, _ in emitted] == [100]
    assert emitted[0][1] == [
        {"timestamp": "2026-01-01T00:00:00", "op": ["transfer", {"from": "a", "to": "b"}]}
    ]


def test_start_live_stream_skips_empty_blocks(monkeypatch):
    head_calls = {"n": 0}

    def fake_head():
        head_calls["n"] += 1
        if head_calls["n"] > 1:
            raise KeyboardInterrupt
        return 100

    emitted = []
    monkeypatch.setattr(live_stream, "get_head_block_num", fake_head)
    monkeypatch.setattr(live_stream, "get_block", lambda n: {"timestamp": "t", "transactions": []})
    monkeypatch.setattr(live_stream, "emit_block_ops", lambda n, txs: emitted.append((n, txs)))
    monkeypatch.setattr(live_stream, "sleep", lambda _s: None)

    with pytest.raises(KeyboardInterrupt):
        live_stream.start_live_stream()

    assert emitted == []  # no ops in the block → nothing emitted
