"""Tests for the Telegram + Voice leaderboard aggregations.

Covers the shared _top_memo_leaderboard / _memo_awards_and_shares helpers and
their 11 public callers in helpers.mongo. The receive_award documents below
match the on-chain shape after parsing: `op` is a dict, and `memo`, `shares`,
and `receiver` are arrays of length 1. The leaderboard pipelines rely on
implicit array traversal of those fields.
"""
import datetime as dt

import pytest

from helpers import mongo
from helpers.enums import OpType


def _award(_id: float, ts: dt.datetime, memo: str, shares: float = 0.0) -> dict:
    return {
        "_id": _id,
        "timestamp": ts,
        "op": {"memo": [memo], "shares": [shares], "receiver": ["x"]},
    }


def _seed(ops: list[dict]) -> None:
    mongo.coll_ops[OpType.receive_award].insert_many(ops)


@pytest.fixture
def window():
    """A wide window centered on a fixed UTC instant — every seeded op falls in."""
    to = dt.datetime(2026, 1, 2, 0, 0, 0, tzinfo=dt.UTC)
    fr = to - dt.timedelta(days=2)
    return to, fr


# ---------------------------------------------------------------------------
# Telegram top-N leaderboards
# ---------------------------------------------------------------------------


async def test_top_tg_posts_by_shares_sums_and_formats_link(window):
    to, fr = window
    h = to - dt.timedelta(hours=12)
    _seed(
        [
            _award(1.1, h, "channel:@viz_news:80", shares=10.0),
            _award(1.2, h, "channel:@viz_news:80", shares=5.0),
            _award(1.3, h, "channel:@other:1", shares=7.0),
        ]
    )
    rows = await mongo.get_top_tg_posts_by_shares_in_period(to, fr, in_top=5, to_skip=0)
    assert rows == [
        {"post": "https://t.me/viz_news/80", "value": 15.0},
        {"post": "https://t.me/other/1", "value": 7.0},
    ]


async def test_top_tg_posts_by_awards_counts_each_op(window):
    to, fr = window
    h = to - dt.timedelta(hours=6)
    _seed(
        [
            _award(2.1, h, "channel:@viz_news:80"),
            _award(2.2, h, "channel:@viz_news:80"),
            _award(2.3, h, "channel:@other:1"),
        ]
    )
    rows = await mongo.get_top_tg_posts_by_awards_count_in_period(
        to_date=to, from_date=fr, in_top=5, to_skip=0
    )
    assert rows[0] == {"post": "https://t.me/viz_news/80", "value": 2}
    assert rows[1] == {"post": "https://t.me/other/1", "value": 1}


async def test_top_tg_channels_by_shares_groups_across_posts(window):
    to, fr = window
    h = to - dt.timedelta(hours=8)
    _seed(
        [
            _award(3.1, h, "channel:@viz_news:80", shares=10.0),
            _award(3.2, h, "channel:@viz_news:81", shares=5.0),  # same channel, diff post
            _award(3.3, h, "channel:@other:1", shares=7.0),
        ]
    )
    rows = await mongo.get_top_tg_ch_by_shares_in_period(
        to_date=to, from_date=fr, in_top=5, to_skip=0
    )
    assert rows == [
        {"channel": "https://t.me/viz_news", "value": 15.0},
        {"channel": "https://t.me/other", "value": 7.0},
    ]


async def test_top_tg_channels_by_awards_counts(window):
    to, fr = window
    h = to - dt.timedelta(hours=4)
    _seed(
        [
            _award(4.1, h, "channel:@viz_news:80"),
            _award(4.2, h, "channel:@viz_news:81"),
            _award(4.3, h, "channel:@viz_news:82"),
            _award(4.4, h, "channel:@other:1"),
        ]
    )
    rows = await mongo.get_top_tg_chs_by_awards_count_in_period(
        to_date=to, from_date=fr, in_top=5, to_skip=0
    )
    assert rows[0] == {"channel": "https://t.me/viz_news", "value": 3}
    assert rows[1] == {"channel": "https://t.me/other", "value": 1}


# ---------------------------------------------------------------------------
# Telegram single-target totals
# ---------------------------------------------------------------------------


async def test_tg_post_totals_match_exact_memo(window):
    to, fr = window
    h = to - dt.timedelta(hours=2)
    _seed(
        [
            _award(5.1, h, "channel:@viz_news:80", shares=10.0),
            _award(5.2, h, "channel:@viz_news:80", shares=5.0),
            _award(5.3, h, "channel:@viz_news:81", shares=100.0),  # different post
        ]
    )
    out = await mongo.get_tg_ch_post_awards_and_shares_in_period(
        "https://t.me/viz_news/80", to_date=to, from_date=fr
    )
    assert out == {"post_link": "https://t.me/viz_news/80", "awards": 2, "shares": 15.0}


async def test_tg_post_totals_zero_when_no_match(window):
    to, fr = window
    out = await mongo.get_tg_ch_post_awards_and_shares_in_period(
        "https://t.me/nothing/999", to_date=to, from_date=fr
    )
    assert out == {"post_link": "https://t.me/nothing/999", "awards": 0, "shares": 0}


async def test_tg_channel_totals_match_prefix_regex(window):
    to, fr = window
    h = to - dt.timedelta(hours=2)
    _seed(
        [
            _award(6.1, h, "channel:@viz_news:80", shares=10.0),
            _award(6.2, h, "channel:@viz_news:81", shares=5.0),
            _award(6.3, h, "channel:@other:1", shares=100.0),
        ]
    )
    out = await mongo.get_tg_ch_awards_and_shares_in_period(
        "@viz_news", to_date=to, from_date=fr
    )
    assert out == {"channel": "@viz_news", "awards": 2, "shares": 15.0}


# ---------------------------------------------------------------------------
# Voice (readdle.me) leaderboards
# ---------------------------------------------------------------------------


async def test_top_voice_posts_by_shares_returns_memo_string(window):
    to, fr = window
    h = to - dt.timedelta(hours=6)
    _seed(
        [
            _award(7.1, h, "viz://@alice/42", shares=9.0),
            _award(7.2, h, "viz://@alice/42", shares=3.0),
            _award(7.3, h, "viz://@bob/100", shares=2.0),
        ]
    )
    rows = await mongo.get_top_readdleme_posts_by_shares_in_period(to, fr, in_top=5, to_skip=0)
    assert rows == [
        {"post": "viz://@alice/42", "value": 12.0},
        {"post": "viz://@bob/100", "value": 2.0},
    ]


async def test_top_voice_authors_by_awards_groups_by_handle(window):
    to, fr = window
    h = to - dt.timedelta(hours=6)
    _seed(
        [
            _award(8.1, h, "viz://@alice/42"),
            _award(8.2, h, "viz://@alice/43"),
            _award(8.3, h, "viz://@bob/100"),
        ]
    )
    rows = await mongo.get_top_readdleme_authors_by_awards_in_period(to, fr, in_top=5, to_skip=0)
    assert rows[0] == {"account": "@alice", "value": 2}
    assert rows[1] == {"account": "@bob", "value": 1}


async def test_voice_author_totals_match_prefix_regex(window):
    to, fr = window
    h = to - dt.timedelta(hours=6)
    _seed(
        [
            _award(9.1, h, "viz://@alice/42", shares=9.0),
            _award(9.2, h, "viz://@alice/43", shares=3.0),
            _award(9.3, h, "viz://@bob/100", shares=2.0),
        ]
    )
    out = await mongo.get_readdleme_author_awards_and_shares_in_period(
        "@alice", to_date=to, from_date=fr
    )
    assert out == {"account": "@alice", "awards": 2, "shares": 12.0}


async def test_voice_author_totals_zero_when_no_match(window):
    to, fr = window
    out = await mongo.get_readdleme_author_awards_and_shares_in_period(
        "@missing", to_date=to, from_date=fr
    )
    assert out == {"account": "@missing", "awards": 0, "shares": 0}


# ---------------------------------------------------------------------------
# Cross-cutting behaviour: windowing, prefix isolation, pagination, defaults
# ---------------------------------------------------------------------------


async def test_top_excludes_ops_outside_window(window):
    to, fr = window
    inside = to - dt.timedelta(hours=12)
    outside_old = fr - dt.timedelta(days=10)
    outside_new = to + dt.timedelta(days=1)
    _seed(
        [
            _award(10.1, inside, "channel:@viz_news:80", shares=10.0),
            _award(10.2, outside_old, "channel:@viz_news:80", shares=999.0),
            _award(10.3, outside_new, "channel:@viz_news:80", shares=999.0),
        ]
    )
    rows = await mongo.get_top_tg_posts_by_shares_in_period(to, fr, in_top=5, to_skip=0)
    assert rows == [{"post": "https://t.me/viz_news/80", "value": 10.0}]


async def test_tg_query_does_not_match_voice_memos(window):
    """The `^channel:@` and `^viz://@` prefixes must isolate the two families.
    Without this guarantee, a voice op could leak into TG leaderboards if it
    happened to contain "channel:" later in its memo."""
    to, fr = window
    h = to - dt.timedelta(hours=6)
    _seed(
        [
            _award(11.1, h, "viz://@alice/42", shares=10.0),
            _award(11.2, h, "channel:@viz_news:80", shares=5.0),
        ]
    )
    tg = await mongo.get_top_tg_posts_by_shares_in_period(to, fr, in_top=5, to_skip=0)
    voice = await mongo.get_top_readdleme_posts_by_shares_in_period(to, fr, in_top=5, to_skip=0)
    assert tg == [{"post": "https://t.me/viz_news/80", "value": 5.0}]
    assert voice == [{"post": "viz://@alice/42", "value": 10.0}]


async def test_pagination_skip_and_limit(window):
    to, fr = window
    h = to - dt.timedelta(hours=6)
    _seed(
        [
            _award(12.1, h, "channel:@a:1", shares=30.0),
            _award(12.2, h, "channel:@b:1", shares=20.0),
            _award(12.3, h, "channel:@c:1", shares=10.0),
        ]
    )
    first_page = await mongo.get_top_tg_ch_by_shares_in_period(to, fr, in_top=2, to_skip=0)
    second_page = await mongo.get_top_tg_ch_by_shares_in_period(to, fr, in_top=2, to_skip=2)
    assert [r["channel"] for r in first_page] == [
        "https://t.me/a",
        "https://t.me/b",
    ]
    assert [r["channel"] for r in second_page] == ["https://t.me/c"]


async def test_default_week_window_resolves_when_arguments_omitted():
    """All functions with mutable-default args used to evaluate dt.datetime.now()
    at import time, freezing the window. After the refactor the defaults are
    resolved on each call, so a freshly seeded op shows up without the caller
    supplying explicit dates."""
    now = dt.datetime.now()
    _seed([_award(13.1, now - dt.timedelta(hours=1), "channel:@viz_news:80", shares=5.0)])
    out = await mongo.get_tg_ch_awards_and_shares_in_period("@viz_news")
    assert out == {"channel": "@viz_news", "awards": 1, "shares": 5.0}


async def test_empty_collection_returns_empty_list(window):
    to, fr = window
    assert await mongo.get_top_tg_posts_by_shares_in_period(to, fr, in_top=5, to_skip=0) == []
    assert await mongo.get_top_readdleme_authors_by_shares_in_period(to, fr, 5, 0) == []


async def test_single_target_respects_window(window):
    """A matching memo outside the window must NOT be counted, even when
    the memo filter alone would match."""
    to, fr = window
    outside = fr - dt.timedelta(days=30)
    _seed([_award(16.1, outside, "channel:@viz_news:80", shares=999.0)])
    out = await mongo.get_tg_ch_post_awards_and_shares_in_period(
        "https://t.me/viz_news/80", to_date=to, from_date=fr
    )
    assert out == {"post_link": "https://t.me/viz_news/80", "awards": 0, "shares": 0}


async def test_single_target_default_window_anchors_to_now():
    """Passing only from_date (or only to_date) must still resolve sensibly:
    omitted bound falls back to its default, not to a frozen import-time value."""
    now = dt.datetime.now()
    _seed([_award(17.1, now - dt.timedelta(hours=2), "viz://@alice/42", shares=4.0)])
    out = await mongo.get_readdleme_author_awards_and_shares_in_period(
        "@alice", from_date=now - dt.timedelta(days=1)
    )
    assert out == {"account": "@alice", "awards": 1, "shares": 4.0}


# ---------------------------------------------------------------------------
# HTTP endpoint shape (smoke level — confirms wiring through FastAPI)
# ---------------------------------------------------------------------------


def test_voice_top_posts_endpoint_returns_expected_shape(client):
    now = dt.datetime.now(dt.UTC)
    _seed([_award(14.1, now - dt.timedelta(hours=1), "viz://@alice/42", shares=9.0)])
    response = client.get("/voice/top_posts", params={"by": "shares", "in_top": 5})
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["posts"] == [{"post": "viz://@alice/42", "value": 9.0}]
    assert "date" in body and "from" in body["date"] and "to" in body["date"]


def test_telegram_top_channels_endpoint_returns_expected_shape(client):
    now = dt.datetime.now(dt.UTC)
    _seed([_award(15.1, now - dt.timedelta(hours=1), "channel:@viz_news:80", shares=12.0)])
    response = client.get(
        "/telegram/top_channels", params={"by": "shares", "in_top": 5}
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["channels"] == [{"channel": "https://t.me/viz_news", "value": 12.0}]
