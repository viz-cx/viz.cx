from fastapi import APIRouter, HTTPException, Response
from helpers.avatar import generateAvatar
from helpers.viz import viz
from viz.account import Account, AccountDoesNotExistsException
from fastapi_cache.decorator import cache


router = APIRouter(
    prefix="/profile",
    tags=["Profile"],
    responses={404: {"description": "Not found"}},
)


@router.get("/{user}")
@cache(expire=60)
async def profile(user: str):
    try:
        acc = Account(user, viz)
        if not isinstance(acc["json_metadata"], dict):
            acc["json_metadata"] = {}
        if "profile" not in acc["json_metadata"]:
            acc["json_metadata"]["profile"] = {}
        if "avatar" not in acc["json_metadata"]["profile"]:
            prefix = "https://viz.cx/api/v1"  # "http://localhost:8080"
            ava = "{}/profile/avatar/{}".format(prefix, user)
            acc["json_metadata"]["profile"]["avatar"] = ava
        return acc
    except AccountDoesNotExistsException:
        raise HTTPException(status_code=404, detail="Account doesn't exists")


@router.get("/avatar/{user}")
@cache()
async def avatar(user: str) -> Response:
    return Response(content=generateAvatar(user), media_type="image/svg+xml")
