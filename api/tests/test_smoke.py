"""Smoke tests proving the test harness wires together correctly."""
from unittest.mock import patch

import pytest


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"chain_id": "test"}


def test_unhandled_error_propagates(client):
    """With the catch-all exception handler removed, server errors surface
    properly (500 rather than 400 with a swallowed message)."""
    with pytest.raises(IndexError):
        client.get("/blocks/latest")


def test_profile_404_for_missing_account(client):
    from viz.account import AccountDoesNotExistsException

    with patch("endpoints.profile.Account", side_effect=AccountDoesNotExistsException()):
        response = client.get("/profile/missing-user")
    assert response.status_code == 404
