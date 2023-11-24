from typing import List
from fastapi import APIRouter

from helpers.mongo import get_saved_posts
from parser.posts import VoiceProtocol

router = APIRouter(prefix="/posts")


@router.get("/", response_model=List[VoiceProtocol], response_model_exclude_unset=True)
def list():
    return get_saved_posts()
