"""Tests for the sorter's deduped meta recalculation.

The sorter receives a block of ops and schedules background recalcs for any
post touched by a viz:// award or a custom 'V' reply. Multiple ops targeting
the same post must collapse to one recalc per post."""
import datetime as dt
import json
from unittest.mock import patch

from helpers import mongo
from helpers.enums import OpType


def _award(memo: str, ts: dt.datetime) -> dict:
    return {
        "timestamp": ts,
        "op": [OpType.receive_award, {"memo": memo, "shares": "0.000000 SHARES", "receiver": "x"}],
    }


def _reply(reply_uri: str, ts: dt.datetime) -> dict:
    body = {"id": "V", "json": json.dumps({"d": {"r": reply_uri, "t": "p"}})}
    return {"timestamp": ts, "op": [OpType.custom, body]}


def _seed_block(block_number: int, ops: list[dict]) -> dict:
    return {"_id": block_number, "block": ops}


def test_multiple_awards_on_same_post_collapse_to_one_recalc(monkeypatch):
    h = dt.datetime(2026, 1, 1, 12, 0, 0, tzinfo=dt.UTC)
    meta_calls: list[tuple[str, int]] = []
    monkeypatch.setattr(
        mongo, "_recalc_post_meta_safe",
        lambda author, block: meta_calls.append((author, block)),
    )
    with patch.object(mongo, "_meta_executor_singleton") as exec_singleton:
        exec_singleton.return_value.submit.side_effect = (
            lambda fn, *args: fn(*args)
        )
        mongo.sort_block_ops_to_subcolls(_seed_block(100, [
            _award("viz://@alice/42", h),
            _award("viz://@alice/42", h),
            _award("viz://@alice/42", h),
        ]))
    assert meta_calls == [("alice", 42)]


def test_awards_on_different_posts_recalc_separately(monkeypatch):
    h = dt.datetime(2026, 1, 1, 12, 0, 0, tzinfo=dt.UTC)
    meta_calls: list[tuple[str, int]] = []
    monkeypatch.setattr(
        mongo, "_recalc_post_meta_safe",
        lambda author, block: meta_calls.append((author, block)),
    )
    with patch.object(mongo, "_meta_executor_singleton") as exec_singleton:
        exec_singleton.return_value.submit.side_effect = (
            lambda fn, *args: fn(*args)
        )
        mongo.sort_block_ops_to_subcolls(_seed_block(101, [
            _award("viz://@alice/42", h),
            _award("viz://@bob/7", h),
        ]))
    assert set(meta_calls) == {("alice", 42), ("bob", 7)}


def test_replies_to_same_parent_collapse_to_one_comment_recalc(monkeypatch):
    h = dt.datetime(2026, 1, 1, 12, 0, 0, tzinfo=dt.UTC)
    comment_calls: list[tuple[str, int]] = []
    monkeypatch.setattr(
        mongo, "_recalc_post_comments_safe",
        lambda author, block: comment_calls.append((author, block)),
    )
    with patch.object(mongo, "_meta_executor_singleton") as exec_singleton:
        exec_singleton.return_value.submit.side_effect = (
            lambda fn, *args: fn(*args)
        )
        mongo.sort_block_ops_to_subcolls(_seed_block(102, [
            _reply("viz://@alice/42", h),
            _reply("viz://@alice/42", h),
        ]))
    assert comment_calls == [("alice", 42)]


def test_award_and_reply_to_same_post_schedule_both_kinds(monkeypatch):
    """An award refreshes meta; a reply refreshes the parent's comment count.
    Same (author, block) must trigger one of each, not collapse together."""
    h = dt.datetime(2026, 1, 1, 12, 0, 0, tzinfo=dt.UTC)
    meta_calls: list[tuple[str, int]] = []
    comment_calls: list[tuple[str, int]] = []
    monkeypatch.setattr(
        mongo, "_recalc_post_meta_safe",
        lambda author, block: meta_calls.append((author, block)),
    )
    monkeypatch.setattr(
        mongo, "_recalc_post_comments_safe",
        lambda author, block: comment_calls.append((author, block)),
    )
    with patch.object(mongo, "_meta_executor_singleton") as exec_singleton:
        exec_singleton.return_value.submit.side_effect = (
            lambda fn, *args: fn(*args)
        )
        mongo.sort_block_ops_to_subcolls(_seed_block(103, [
            _award("viz://@alice/42", h),
            _reply("viz://@alice/42", h),
        ]))
    assert meta_calls == [("alice", 42)]
    assert comment_calls == [("alice", 42)]


def test_non_viz_award_does_not_trigger_recalc(monkeypatch):
    """Channel awards (memo doesn't start with viz://) must not enqueue
    post-meta recalcs."""
    h = dt.datetime(2026, 1, 1, 12, 0, 0, tzinfo=dt.UTC)
    meta_calls: list[tuple[str, int]] = []
    monkeypatch.setattr(
        mongo, "_recalc_post_meta_safe",
        lambda author, block: meta_calls.append((author, block)),
    )
    with patch.object(mongo, "_meta_executor_singleton") as exec_singleton:
        exec_singleton.return_value.submit.side_effect = (
            lambda fn, *args: fn(*args)
        )
        mongo.sort_block_ops_to_subcolls(_seed_block(104, [
            _award("channel:@viz_news:80", h),
        ]))
    assert meta_calls == []
