"""Tests for the paginated /sitemap/posts endpoint."""
import datetime as dt

from helpers.db_client import get_db


def _insert_post(author: str, block: int, *, ts: dt.datetime | None = None):
    coll_posts = get_db()["posts"]
    coll_posts.insert_one(
        {
            "author": author,
            "block": block,
            "d": {"t": f"post {block}"},
            "timestamp": ts or dt.datetime(2026, 1, 1, tzinfo=dt.UTC),
        }
    )


def test_sitemap_returns_paginated_items(client):
    for i in range(5):
        _insert_post("alice", 100 + i)

    response = client.get("/sitemap/posts?limit=2")
    assert response.status_code == 200
    body = response.json()
    assert body["page"] == 0
    assert body["has_more"] is True
    assert len(body["items"]) == 2
    assert body["items"][0]["loc"].startswith("https://viz.cx/@alice/")


def test_sitemap_last_page_signals_no_more(client):
    for i in range(3):
        _insert_post("bob", 200 + i)

    page0 = client.get("/sitemap/posts?limit=2").json()
    page1 = client.get("/sitemap/posts?page=1&limit=2").json()

    assert page0["has_more"] is True
    assert page1["page"] == 1
    assert page1["has_more"] is False
    assert len(page1["items"]) == 1


def test_sitemap_excludes_replies(client):
    _insert_post("alice", 300)
    coll_posts = get_db()["posts"]
    coll_posts.insert_one(
        {
            "author": "bob",
            "block": 301,
            "d": {"t": "reply", "r": "viz://@alice/300"},
            "timestamp": dt.datetime(2026, 1, 1, tzinfo=dt.UTC),
        }
    )

    body = client.get("/sitemap/posts").json()
    locs = [item["loc"] for item in body["items"]]
    assert "https://viz.cx/@alice/300" in locs
    assert "https://viz.cx/@bob/301" not in locs


def test_sitemap_limit_capped(client):
    response = client.get("/sitemap/posts?limit=99999")
    assert response.status_code == 422
