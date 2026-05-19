"""Regression tests for the bug where to_date/from_date defaults were
evaluated at module import time, producing a frozen-clock effect."""
import datetime as dt
from unittest.mock import patch


def test_voice_top_posts_resolves_window_per_request(client, monkeypatch):
    calls: list = []

    def fake_top(to, fr, in_top, to_skip):
        calls.append((to, fr))
        return []

    monkeypatch.setattr(
        "helpers.mongo.get_top_readdleme_posts_by_shares_in_period", fake_top
    )

    fake_now = dt.datetime(2030, 1, 1, 12, 0, 0, tzinfo=dt.UTC)
    with patch("helpers.dates.utcnow", return_value=fake_now):
        response = client.get("/voice/top_posts?by=shares")
    assert response.status_code == 200
    assert len(calls) == 1
    to, fr = calls[0]
    assert to == fake_now
    assert fr == fake_now - dt.timedelta(weeks=1)


def test_telegram_top_posts_uses_explicit_dates(client, monkeypatch):
    captured: list = []

    def fake_top(to, fr, in_top, to_skip):
        captured.append((to, fr))
        return []

    monkeypatch.setattr(
        "helpers.mongo.get_top_tg_posts_by_shares_in_period", fake_top
    )

    response = client.get(
        "/telegram/top_posts"
        "?by=shares"
        "&to_date=2026-01-15T00:00:00Z"
        "&from_date=2026-01-01T00:00:00Z"
    )
    assert response.status_code == 200
    to, fr = captured[0]
    assert to.year == 2026 and to.month == 1 and to.day == 15
    assert fr.year == 2026 and fr.month == 1 and fr.day == 1
