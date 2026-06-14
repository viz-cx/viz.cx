"""Tests for parser start-block resolution and tip-emit behaviour.

Covers resolve_start_block (jump-past-hole logic driven by PARSER_START_BLOCK)
and _at_tip (lag-window check that gates TipReached events).
"""

from parser import parser as parser_mod
from parser.parser import resolve_start_block


def test_resolve_start_block_no_env(monkeypatch):
    monkeypatch.delenv("PARSER_START_BLOCK", raising=False)
    assert resolve_start_block(100) == 100


def test_resolve_start_block_jumps_ahead(monkeypatch):
    monkeypatch.setenv("PARSER_START_BLOCK", "500")
    assert resolve_start_block(100) == 499  # parser resumes at 500


def test_resolve_start_block_never_rewinds(monkeypatch):
    monkeypatch.setenv("PARSER_START_BLOCK", "50")
    assert resolve_start_block(100) == 100


def test_at_tip_true_within_window(monkeypatch):
    monkeypatch.setattr(parser_mod, "EMIT_TIP_LAG", 5)
    assert parser_mod._at_tip(last_chain_block=100, block_num=96) is True
    assert parser_mod._at_tip(last_chain_block=100, block_num=100) is True


def test_at_tip_false_outside_window(monkeypatch):
    monkeypatch.setattr(parser_mod, "EMIT_TIP_LAG", 5)
    assert parser_mod._at_tip(last_chain_block=100, block_num=94) is False
