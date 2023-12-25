from typing import List
from fastapi import APIRouter

from helpers.mongo import get_saved_posts, get_saved_post
from parser.posts import VoiceProtocol

router = APIRouter(
    prefix="/posts",
    tags=["Posts"],
    responses={404: {"description": "Not found"}},
)


@router.get(
    "/page/{page}",
    response_model=List[VoiceProtocol],
    response_model_exclude_unset=True,
)
def list(page: int):
    return get_saved_posts(limit=10, page=page)


@router.get("/{id}", response_model=VoiceProtocol, response_model_exclude_unset=True)
def post(id: int):
    return get_saved_post(id)
