"""Tests for /accounts/{name}/history."""
import datetime as dt

from helpers import mongo


def _insert_ops(rows):
    """Insert pre-built op rows directly into the unsorted ops collection."""
    coll = mongo.coll_ops
    coll.insert_many(rows)


def _row(op_id: float, op_type: str, body: dict, ts: dt.datetime):
    return {"_id": op_id, "timestamp": ts, "op": [op_type, body]}


def test_history_returns_ops_where_account_is_sender_or_receiver(client):
    h = dt.datetime(2026, 1, 1, 10, 0, 0, tzinfo=dt.UTC)
    _insert_ops(
        [
            _row(100.001, "transfer", {"from": "alice", "to": "bob", "amount": 1.0}, h),
            _row(100.002, "transfer", {"from": "carol", "to": "alice", "amount": 2.0}, h),
            _row(100.003, "transfer", {"from": "carol", "to": "bob", "amount": 3.0}, h),
        ]
    )
    response = client.get("/accounts/alice/history")
    assert response.status_code == 200, response.text
    body = response.json()
    assert {item["op_id"] for item in body["items"]} == {100.001, 100.002}


def test_history_counterparty_filter(client):
    h = dt.datetime(2026, 1, 1, 10, 0, 0, tzinfo=dt.UTC)
    _insert_ops(
        [
            _row(101.001, "transfer", {"from": "alice", "to": "bob", "amount": 1.0}, h),
            _row(101.002, "transfer", {"from": "alice", "to": "carol", "amount": 2.0}, h),
        ]
    )
    response = client.get("/accounts/alice/history", params={"counterparty": "bob"})
    assert response.status_code == 200, response.text
    items = response.json()["items"]
    assert {item["op_id"] for item in items} == {101.001}


def test_history_op_type_filter(client):
    h = dt.datetime(2026, 1, 1, 10, 0, 0, tzinfo=dt.UTC)
    _insert_ops(
        [
            _row(102.001, "transfer", {"from": "alice", "to": "bob"}, h),
            _row(102.002, "vote", {"voter": "alice", "author": "bob", "permlink": "x"}, h),
            _row(102.003, "transfer", {"from": "alice", "to": "carol"}, h),
        ]
    )
    response = client.get("/accounts/alice/history", params={"op_type": "transfer"})
    assert response.status_code == 200, response.text
    items = response.json()["items"]
    assert {item["op_id"] for item in items} == {102.001, 102.003}


def test_history_pagination_with_cursor(client):
    h = dt.datetime(2026, 1, 1, 10, 0, 0, tzinfo=dt.UTC)
    _insert_ops(
        [
            _row(200.0 + i, "transfer", {"from": "alice", "to": "bob"}, h + dt.timedelta(seconds=i))
            for i in range(6)
        ]
    )
    page1 = client.get("/accounts/alice/history", params={"limit": 3}).json()
    assert len(page1["items"]) == 3
    assert page1["next_cursor"] is not None

    page2 = client.get(
        "/accounts/alice/history",
        params={"limit": 3, "cursor": page1["next_cursor"]},
    ).json()
    assert len(page2["items"]) == 3
    page1_ids = {i["op_id"] for i in page1["items"]}
    page2_ids = {i["op_id"] for i in page2["items"]}
    assert page1_ids.isdisjoint(page2_ids)
    assert page2["next_cursor"] is None


def test_history_includes_shares_ops_from_subcollection(client):
    h = dt.datetime(2026, 1, 1, 10, 0, 0, tzinfo=dt.UTC)
    mongo.coll_ops["witness_reward"].insert_one(
        _row(300.001, "witness_reward", {"receiver": "alice", "shares": 1.5}, h)
    )
    response = client.get("/accounts/alice/history")
    assert response.status_code == 200, response.text
    ids = {item["op_id"] for item in response.json()["items"]}
    assert 300.001 in ids
