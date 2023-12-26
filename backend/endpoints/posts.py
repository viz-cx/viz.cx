from fastapi import APIRouter

from helpers.mongo import get_saved_posts, get_saved_post

router = APIRouter(
    prefix="/posts",
    tags=["Posts"],
    responses={404: {"description": "Not found"}},
)


@router.get(
    "/page/{page}",
)
def list(page: int):
    return get_saved_posts(limit=10, page=page)


@router.get("/{id}")
def post(id: int):
    return get_saved_post(id)
