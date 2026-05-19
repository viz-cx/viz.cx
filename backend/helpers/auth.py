from helpers.viz import get_client


def verify_user(login: str, public_key: str) -> bool:
    """Legacy: checks if a public key is in the account's regular authority.

    WARNING: This proves nothing about the caller. Public keys are public.
    Endpoints that require true authentication should use the signature
    challenge flow in helpers.signature_auth.
    """
    try:
        viz = get_client()
        assert viz.rpc is not None
        accounts = viz.rpc.get_accounts([login])
        if not accounts:
            return False
        account = accounts[0]
        threshold = account["regular_authority"]["weight_threshold"]
        for key, weight in account["regular_authority"]["key_auths"]:
            if key == public_key and weight >= threshold:
                return True
        return False
    except Exception:
        return False
