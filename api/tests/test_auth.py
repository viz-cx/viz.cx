"""End-to-end tests for the signature-challenge auth flow."""
from graphenebase.account import PrivateKey
from graphenebase.ecdsa import sign_message


def _make_keypair():
    priv = PrivateKey()
    wif = str(priv)
    pub = format(priv.pubkey, "VIZ")
    return wif, pub


def _set_account(_viz, name: str, pub: str, threshold: int = 1, weight: int = 1):
    _viz.rpc.get_accounts.return_value = [
        {
            "name": name,
            "regular_authority": {
                "weight_threshold": threshold,
                "key_auths": [[pub, weight]],
            },
        }
    ]


def test_nonce_endpoint_returns_unique_values(client):
    a = client.post("/auth/nonce").json()["nonce"]
    b = client.post("/auth/nonce").json()["nonce"]
    assert a and b and a != b


def test_signed_request_succeeds_when_key_in_authority(client, _viz):
    wif, pub = _make_keypair()
    _set_account(_viz, "alice", pub)

    nonce = client.post("/auth/nonce").json()["nonce"]
    sig = sign_message(nonce.encode("utf-8"), wif).hex()

    response = client.post(
        "/posts/",
        json={"blocks": [{"type": "paragraph", "data": {"text": "hi"}}]},
        headers={
            "X-Auth-Account": "alice",
            "X-Auth-Nonce": nonce,
            "X-Auth-Signature": sig,
        },
    )
    assert response.status_code == 200, response.text
    assert "id" in response.json()


def test_signed_request_rejects_wrong_key(client, _viz):
    wif_attacker, _ = _make_keypair()
    _, pub_owner = _make_keypair()
    _set_account(_viz, "alice", pub_owner)

    nonce = client.post("/auth/nonce").json()["nonce"]
    sig = sign_message(nonce.encode("utf-8"), wif_attacker).hex()

    response = client.post(
        "/posts/",
        json={"blocks": [{"type": "paragraph", "data": {"text": "hi"}}]},
        headers={
            "X-Auth-Account": "alice",
            "X-Auth-Nonce": nonce,
            "X-Auth-Signature": sig,
        },
    )
    assert response.status_code == 401


def test_nonce_is_single_use(client, _viz):
    wif, pub = _make_keypair()
    _set_account(_viz, "alice", pub)

    nonce = client.post("/auth/nonce").json()["nonce"]
    sig = sign_message(nonce.encode("utf-8"), wif).hex()
    headers = {
        "X-Auth-Account": "alice",
        "X-Auth-Nonce": nonce,
        "X-Auth-Signature": sig,
    }
    body = {"blocks": [{"type": "paragraph", "data": {"text": "hi"}}]}

    first = client.post("/posts/", json=body, headers=headers)
    second = client.post("/posts/", json=body, headers=headers)

    assert first.status_code == 200
    assert second.status_code == 401


def test_missing_headers_rejected(client):
    response = client.post(
        "/posts/",
        json={"blocks": [{"type": "paragraph", "data": {"text": "hi"}}]},
    )
    assert response.status_code == 401


def test_weight_below_threshold_rejected(client, _viz):
    wif, pub = _make_keypair()
    _set_account(_viz, "alice", pub, threshold=2, weight=1)

    nonce = client.post("/auth/nonce").json()["nonce"]
    sig = sign_message(nonce.encode("utf-8"), wif).hex()

    response = client.post(
        "/posts/",
        json={"blocks": [{"type": "paragraph", "data": {"text": "hi"}}]},
        headers={
            "X-Auth-Account": "alice",
            "X-Auth-Nonce": nonce,
            "X-Auth-Signature": sig,
        },
    )
    assert response.status_code == 401
