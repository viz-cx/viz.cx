import os
import io
import requests
from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import FileResponse
from PIL import Image
from helpers.avatar import generateAvatar
from helpers.viz import viz
from viz.account import Account, AccountDoesNotExistsException
from fastapi_cache.decorator import cache
from pathlib import Path


router = APIRouter(
    prefix="/profile",
    tags=["Profile"],
    responses={404: {"description": "Not found"}},
)


@router.get("/{user}")
@cache(expire=60)
async def profile(user: str):
    return vizAccount(user=user)


@router.get("/avatar/{user}")
async def avatar(user: str) -> Response:
    try:
        path = Path("./ava")
        path.mkdir(parents=True, exist_ok=True)
        file_path = Path(os.path.join(path, user))
        if file_path.is_file():
            return FileResponse(path=file_path)
        acc = vizAccount(user=user)
        ava = acc["json_metadata"]["profile"]["avatar"]
        r = requests.get(ava, stream=True)
        if r.status_code == 200:
            img = Image.open(io.BytesIO(r.content))
            img.save(file_path)
        return Response(r.content)
    except Exception as e:
        print("Avatar error: {}".format(str(e)))
    return Response(content=generateAvatar(user), media_type="image/svg+xml")


def vizAccount(user: str) -> Account:
    try:
        acc = Account(user, viz)
        if not isinstance(acc["json_metadata"], dict):
            acc["json_metadata"] = {}
        if "profile" not in acc["json_metadata"]:
            acc["json_metadata"]["profile"] = {}
        if "avatar" not in acc["json_metadata"]["profile"]:
            prefix = "https://viz.cx/api/v1"  # "http://localhost:8080"
            ava = "{}/profile/avatar/{}.svg".format(prefix, user)
            acc["json_metadata"]["profile"]["avatar"] = ava
        return acc
    except AccountDoesNotExistsException:
        raise HTTPException(status_code=404, detail="Account doesn't exists")
