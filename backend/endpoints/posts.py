from fastapi import APIRouter

from helpers.mongo import get_saved_posts, get_saved_post

router = APIRouter(
    prefix="/posts",
    tags=["Posts"],
    responses={404: {"description": "Not found"}},
)


@router.get("/{tab}/{page}")
def posts(tab: str, page: int):
    return postsHelper(tab=tab, page=page)


@router.get("/{tab}/{author}/{page}")
def authorPosts(tab: str, author: str, page: int):
    return postsHelper(tab=tab, page=page, author=author)


def postsHelper(tab: str, page: int, author: str | None = None):
    if tab in ["newest", "popular"]:
        isPopular = tab == "popular"
        return get_saved_posts(limit=10, page=page, popular=isPopular, author=author)
    else:
        return "Incorrect tab"


@router.get("/{id}")
def post(id: int):
    return get_saved_post(id)
