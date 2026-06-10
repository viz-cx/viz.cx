"""Tests for VIZ node selection and the grapheneapi HTTP transport patch."""
import requests

from helpers import viz as viz_module


def test_nodes_from_env(monkeypatch):
    monkeypatch.setenv("VIZ_NODES", "https://api.viz.world, wss://node.viz.cx/ws ,")
    assert viz_module._nodes_from_env() == [
        "https://api.viz.world",
        "wss://node.viz.cx/ws",
    ]


def test_nodes_from_env_default(monkeypatch):
    monkeypatch.delenv("VIZ_NODES", raising=False)
    assert viz_module._nodes_from_env() == ["wss://node.viz.cx/ws"]


def test_http_transport_session_is_real_session():
    """grapheneapi's Http.get_request_session is broken when __init__ hasn't
    run: the missing private attr falls through to Rpc.__getattr__, which
    returns an RPC proxy function instead of raising. Our patch must return
    a real requests.Session regardless, and cache it."""
    from grapheneapi.http import Http

    h = Http.__new__(Http)  # deliberately skip __init__, mirroring the bug
    s = h.get_request_session()
    assert isinstance(s, requests.Session)
    assert h.get_request_session() is s
