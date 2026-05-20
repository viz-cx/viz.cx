from fastapi import APIRouter

from helpers.signature_auth import issue_nonce

router = APIRouter(
    prefix="/auth",
    tags=["Auth"],
    responses={401: {"description": "Authentication failed"}},
)


@router.post("/nonce")
def get_nonce() -> dict[str, str]:
    """Issue a single-use nonce. Client signs this with their WIF and sends
    the signature in X-Auth-Signature alongside X-Auth-Account and
    X-Auth-Nonce on authenticated requests. Nonce expires in 5 minutes."""
    return {"nonce": issue_nonce()}
