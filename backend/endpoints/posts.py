from fastapi import APIRouter

from helpers.mongo import get_saved_posts, get_saved_post

router = APIRouter(
    prefix="/posts",
    tags=["Posts"],
    responses={404: {"description": "Not found"}},
)


@router.get("/newest/{page}")
def newest(page: int):
    return get_saved_posts(limit=10, page=page)


@router.get("/popular/{page}")
def popular(page: int):
    return get_saved_posts(limit=10, page=page, popular=True)


@router.get("/{id}")
def post(id: int):
    return get_saved_post(id)
