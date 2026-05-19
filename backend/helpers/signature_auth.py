"""Signature-challenge authentication.

Flow:
    1. Client calls POST /auth/nonce → server returns a single-use nonce
    2. Client signs the nonce bytes with their WIF private key
    3. Client sends authenticated request with headers:
         X-Auth-Account, X-Auth-Nonce, X-Auth-Signature (hex)
    4. Server atomically consumes the nonce, recovers the public key from
       the signature, and verifies that pubkey is in the account's
       regular_authority with sufficient weight.

This proves the caller controls the private key — unlike the old auth that
just checked whether a public key (public data) existed in the authority.
"""
from __future__ import annotations

import datetime as dt
import logging
import secrets
from typing import Any

from fastapi import Header, HTTPException, status
from graphenebase.account import PublicKey
from graphenebase.ecdsa import verify_message

from helpers.db_client import get_db
from helpers.viz import get_client

logger = logging.getLogger(__name__)

NONCE_TTL = dt.timedelta(minutes=5)
KEY_PREFIX = "VIZ"


def _nonces():
    return get_db()["auth_nonces"]


def ensure_nonce_indexes() -> None:
    """TTL index so expired nonces self-clean."""
    _nonces().create_index(
        [("created_at", 1)], expireAfterSeconds=int(NONCE_TTL.total_seconds())
    )


def issue_nonce() -> str:
    """Create a single-use nonce and persist it."""
    nonce = secrets.token_urlsafe(24)
    _nonces().insert_one({"_id": nonce, "created_at": dt.datetime.now(dt.UTC)})
    return nonce


def _consume_nonce(nonce: str) -> bool:
    """Atomically delete a nonce. Returns True if it existed."""
    result = _nonces().delete_one({"_id": nonce})
    return result.deleted_count == 1


def _account_authority(login: str) -> dict[str, Any] | None:
    viz = get_client()
    assert viz.rpc is not None
    accounts = viz.rpc.get_accounts([login])
    if not accounts:
        return None
    return accounts[0].get("regular_authority")


def _pubkey_bytes(key_string: str) -> bytes:
    return bytes(PublicKey(key_string, prefix=KEY_PREFIX))


def verify_signature(account: str, nonce: str, signature_hex: str) -> str:
    """Consume the nonce and verify the signature. Returns the account name
    on success; raises HTTPException(401) on any failure."""
    if not (account and nonce and signature_hex):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing auth headers")

    try:
        sig_bytes = bytes.fromhex(signature_hex)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Bad signature encoding")
    if len(sig_bytes) != 65:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Bad signature length")

    if not _consume_nonce(nonce):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unknown or expired nonce")

    try:
        recovered = verify_message(nonce.encode("utf-8"), sig_bytes)
    except Exception as exc:
        logger.info("Signature verification failed for %s: %s", account, exc)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Bad signature")

    authority = _account_authority(account)
    if not authority:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unknown account")

    threshold = authority["weight_threshold"]
    for key_string, weight in authority["key_auths"]:
        try:
            if _pubkey_bytes(key_string) == recovered and weight >= threshold:
                return account
        except Exception:
            continue

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Key not authorized")


def require_signed_request(
    x_auth_account: str = Header(default=""),
    x_auth_nonce: str = Header(default=""),
    x_auth_signature: str = Header(default=""),
) -> str:
    """FastAPI dependency: returns the authenticated account name."""
    return verify_signature(x_auth_account, x_auth_nonce, x_auth_signature)
