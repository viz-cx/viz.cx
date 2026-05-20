"""Tests for the sorter's deduped meta recalculation.

The sorter receives a block of ops and schedules background recalcs for any
post touched by a viz:// award or a custom 'V' reply. Multiple ops targeting
the same post must collapse to one recalc per post — and across a K-block
batch the same (author, block) hit by ops in multiple blocks collapses to
one bulk-recalc call that handles the whole set."""
import datetime as dt
import json
from contextlib import contextmanager
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


def _capture_bulk(monkeypatch) -> tuple[list[set], list[set]]:
    """Patch the two bulk recalc entrypoints so tests can inspect which
    (author, block) sets the sorter handed off, without running real
    aggregate pipelines against mongomock."""
    meta_targets: list[set] = []
    comment_targets: list[set] = []
    monkeypatch.setattr(
        mongo, "_bulk_recalc_post_meta",
        lambda targets: meta_targets.append(set(targets)),
    )
    monkeypatch.setattr(
        mongo, "_bulk_recalc_post_comments",
        lambda targets: comment_targets.append(set(targets)),
    )
    return meta_targets, comment_targets


@contextmanager
def _inline_executor():
    """Replace the recalc thread pool so submitted work runs inline; lets
    tests assert against the patched bulk recalcs synchronously."""
    with patch.object(mongo, "_meta_executor_singleton") as exec_singleton:
        exec_singleton.return_value.submit.side_effect = (
            lambda fn, *args: fn(*args)
        )
        yield


def test_multiple_awards_on_same_post_collapse_to_one_recalc(monkeypatch):
    h = dt.datetime(2026, 1, 1, 12, 0, 0, tzinfo=dt.UTC)
    meta_targets, _ = _capture_bulk(monkeypatch)
    with _inline_executor():
        mongo.sort_block_ops_to_subcolls(_seed_block(100, [
            _award("viz://@alice/42", h),
            _award("viz://@alice/42", h),
            _award("viz://@alice/42", h),
        ]))
    assert meta_targets == [{("alice", 42)}]


def test_awards_on_different_posts_recalc_separately(monkeypatch):
    h = dt.datetime(2026, 1, 1, 12, 0, 0, tzinfo=dt.UTC)
    meta_targets, _ = _capture_bulk(monkeypatch)
    with _inline_executor():
        mongo.sort_block_ops_to_subcolls(_seed_block(101, [
            _award("viz://@alice/42", h),
            _award("viz://@bob/7", h),
        ]))
    assert meta_targets == [{("alice", 42), ("bob", 7)}]


def test_replies_to_same_parent_collapse_to_one_comment_recalc(monkeypatch):
    h = dt.datetime(2026, 1, 1, 12, 0, 0, tzinfo=dt.UTC)
    _, comment_targets = _capture_bulk(monkeypatch)
    with _inline_executor():
        mongo.sort_block_ops_to_subcolls(_seed_block(102, [
            _reply("viz://@alice/42", h),
            _reply("viz://@alice/42", h),
        ]))
    assert comment_targets == [{("alice", 42)}]


def test_award_and_reply_to_same_post_schedule_both_kinds(monkeypatch):
    """An award refreshes meta; a reply refreshes the parent's comment count.
    Same (author, block) must trigger one of each, not collapse together."""
    h = dt.datetime(2026, 1, 1, 12, 0, 0, tzinfo=dt.UTC)
    meta_targets, comment_targets = _capture_bulk(monkeypatch)
    with _inline_executor():
        mongo.sort_block_ops_to_subcolls(_seed_block(103, [
            _award("viz://@alice/42", h),
            _reply("viz://@alice/42", h),
        ]))
    assert meta_targets == [{("alice", 42)}]
    assert comment_targets == [{("alice", 42)}]


def test_non_viz_award_does_not_trigger_recalc(monkeypatch):
    """Channel awards (memo doesn't start with viz://) must not enqueue
    post-meta recalcs — no bulk submission at all."""
    h = dt.datetime(2026, 1, 1, 12, 0, 0, tzinfo=dt.UTC)
    meta_targets, _ = _capture_bulk(monkeypatch)
    with _inline_executor():
        mongo.sort_block_ops_to_subcolls(_seed_block(104, [
            _award("channel:@viz_news:80", h),
        ]))
    assert meta_targets == []


# ---------------------------------------------------------------------------
# Bulk path: sort_blocks_to_subcolls processes N blocks in one pass.
# ---------------------------------------------------------------------------


def test_bulk_ops_land_in_subcollections_in_block_op_order(monkeypatch):
    """Ops from N blocks fan out to the right subcollections, with _id
    preserving (block, op#) order so a sort-by-_id read returns ops in the
    same order the blockchain produced them."""
    h = dt.datetime(2026, 1, 1, 12, 0, 0, tzinfo=dt.UTC)
    with patch.object(mongo, "_meta_executor_singleton") as exec_singleton:
        exec_singleton.return_value.submit.side_effect = (
            lambda fn, *args: None
        )
        mongo.sort_blocks_to_subcolls([
            _seed_block(200, [
                _award("viz://@alice/1", h),
                _reply("viz://@alice/1", h),
            ]),
            _seed_block(201, [
                _reply("viz://@bob/2", h),
                _award("viz://@bob/2", h),
            ]),
        ])

    award_docs = list(
        mongo.coll_ops[OpType.receive_award].find({}).sort("_id", 1)
    )
    assert [int(d["_id"]) for d in award_docs] == [200, 201]
    assert award_docs[0]["_id"] < award_docs[1]["_id"]

    custom_docs = list(mongo.coll_ops[OpType.custom].find({}).sort("_id", 1))
    assert [int(d["_id"]) for d in custom_docs] == [200, 201]
    # Within block 200 the reply was the 2nd op; within block 201 it was the 1st.
    assert custom_docs[0]["_id"] > 200 and custom_docs[0]["_id"] < 201
    assert custom_docs[1]["_id"] > 201 and custom_docs[1]["_id"] < 202


def test_bulk_recalc_dedupes_across_blocks(monkeypatch):
    """Same (author, block) target hit by ops in two different input blocks
    must produce exactly one entry in the deduped set handed to the bulk
    recalc — not two."""
    h = dt.datetime(2026, 1, 1, 12, 0, 0, tzinfo=dt.UTC)
    meta_targets, comment_targets = _capture_bulk(monkeypatch)
    with _inline_executor():
        mongo.sort_blocks_to_subcolls([
            _seed_block(300, [
                _award("viz://@alice/42", h),
                _reply("viz://@alice/42", h),
            ]),
            _seed_block(301, [
                _award("viz://@alice/42", h),
                _reply("viz://@alice/42", h),
            ]),
            _seed_block(302, [
                _award("viz://@bob/9", h),
            ]),
        ])
    assert meta_targets == [{("alice", 42), ("bob", 9)}]
    assert comment_targets == [{("alice", 42)}]


def test_bulk_batch_of_one_matches_single_block_path(monkeypatch):
    """Calling the bulk entrypoint with [block] must yield the same
    side effects as the single-block path: ops in subcolls, dedupe of
    same-post awards, exactly one bulk-recalc handoff."""
    h = dt.datetime(2026, 1, 1, 12, 0, 0, tzinfo=dt.UTC)
    meta_targets, _ = _capture_bulk(monkeypatch)
    with _inline_executor():
        mongo.sort_blocks_to_subcolls([_seed_block(400, [
            _award("viz://@alice/42", h),
            _award("viz://@alice/42", h),
            _award("viz://@alice/42", h),
        ])])

    assert meta_targets == [{("alice", 42)}]
    award_docs = list(
        mongo.coll_ops[OpType.receive_award].find({}).sort("_id", 1)
    )
    assert len(award_docs) == 3
    assert all(int(d["_id"]) == 400 for d in award_docs)
    # Ops keep monotonic op# fractions within the block.
    assert award_docs[0]["_id"] < award_docs[1]["_id"] < award_docs[2]["_id"]
