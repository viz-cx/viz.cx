"""Tests for the rollups precomputed aggregations."""
import datetime as dt

from helpers import rollups


def _op(op_type: str, timestamp: dt.datetime, shares: float = 0.0) -> dict:
    payload: dict = {"shares": shares} if shares else {}
    return {"timestamp": timestamp, "op": [op_type, payload]}


async def test_aggregate_ops_counts_by_hour():
    h1 = dt.datetime(2026, 1, 1, 12, 0, 0, tzinfo=dt.UTC)
    h2 = dt.datetime(2026, 1, 1, 13, 0, 0, tzinfo=dt.UTC)
    rollups.aggregate_ops(
        [
            _op("transfer", h1 + dt.timedelta(minutes=5)),
            _op("transfer", h1 + dt.timedelta(minutes=30)),
            _op("transfer", h2 + dt.timedelta(minutes=10)),
            _op("custom", h1 + dt.timedelta(minutes=15)),
        ]
    )
    assert await rollups.get_count(op_type="transfer") == 3
    assert await rollups.get_count(op_type="custom") == 1
    assert await rollups.get_count() == 4


async def test_aggregate_ops_sums_shares():
    h = dt.datetime(2026, 1, 1, 12, 0, 0, tzinfo=dt.UTC)
    rollups.aggregate_ops(
        [
            _op("witness_reward", h, shares=1.5),
            _op("witness_reward", h + dt.timedelta(minutes=10), shares=2.5),
            _op("transfer", h, shares=0.0),
        ]
    )
    assert await rollups.get_shares_sum(op_type="witness_reward") == 4.0
    assert await rollups.get_shares_sum(op_type="transfer") == 0.0


async def test_aggregate_ops_accepts_raw_string_shares():
    """Raw block ops carry shares as '0.199999 SHARES' strings; the backfill
    feeds them to aggregate_ops unconverted (the sorter converts first)."""
    h = dt.datetime(2026, 1, 1, 12, 0, 0, tzinfo=dt.UTC)
    rollups.aggregate_ops(
        [
            {"timestamp": h, "op": ["witness_reward", {"shares": "0.199999 SHARES"}]},
            {"timestamp": h, "op": ["witness_reward", {"shares": 0.300001}]},
        ]
    )
    assert await rollups.get_shares_sum(op_type="witness_reward") == 0.5


async def test_get_count_in_range_inclusive_left_exclusive_right():
    h = dt.datetime(2026, 1, 1, 10, 0, 0, tzinfo=dt.UTC)
    rollups.aggregate_ops([_op("transfer", h + dt.timedelta(minutes=i * 30)) for i in range(6)])
    assert await rollups.get_count(
        op_type="transfer", from_date=h, to_date=h + dt.timedelta(hours=2)
    ) == 4
    assert await rollups.get_count(
        op_type="transfer",
        from_date=h + dt.timedelta(hours=1),
        to_date=h + dt.timedelta(hours=3),
    ) == 4


def test_endpoint_count_all(client):
    h = dt.datetime(2026, 1, 1, 10, 0, 0, tzinfo=dt.UTC)
    rollups.aggregate_ops([_op("transfer", h), _op("custom", h)])
    response = client.get("/count_ops/all")
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["operations"] == 2
    assert body["operation_type"] == "all"


def test_endpoint_shares_all(client):
    h = dt.datetime(2026, 1, 1, 10, 0, 0, tzinfo=dt.UTC)
    rollups.aggregate_ops([_op("witness_reward", h, shares=3.0)])
    response = client.get("/shares/all")
    assert response.status_code == 200, response.text
    assert response.json()["shares"] == 3.0


def test_endpoint_series_returns_per_hour_points(client):
    h = dt.datetime(2026, 1, 1, 10, 0, 0, tzinfo=dt.UTC)
    rollups.aggregate_ops(
        [
            _op("transfer", h + dt.timedelta(minutes=10)),
            _op("transfer", h + dt.timedelta(hours=1, minutes=20)),
            _op("custom", h + dt.timedelta(minutes=5)),
        ]
    )
    response = client.get(
        "/count_ops/series",
        params={
            "from_date": (h - dt.timedelta(hours=1)).isoformat(),
            "to_date": (h + dt.timedelta(hours=3)).isoformat(),
        },
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert {(p["op_type"], p["count"]) for p in body["points"]} == {
        ("transfer", 1),
        ("transfer", 1),
        ("custom", 1),
    }
