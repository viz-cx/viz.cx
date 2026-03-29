from helpers.viz import viz


def verify_user(login: str, public_key: str) -> bool:
    try:
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
