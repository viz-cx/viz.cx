from fastapi import APIRouter

from helpers.mongo import get_post_comments, get_saved_posts, get_saved_post

router = APIRouter(
    prefix="/posts",
    tags=["Posts"],
    responses={404: {"description": "Not found"}},
)


@router.get("/@{author}/{block}")
def post(author: str, block: int):
    return get_saved_post(author, block)


@router.get("/comments/@{author}/{block}")
def comments(author: str, block: int):
    comments = get_post_comments(author=author, block=block)
    return comments


@router.get("/{tab}/{page}")
def posts(tab: str, page: int):
    return postsHelper(tab=tab, page=page)


@router.get("/{tab}/{author}/{page}")
def authorPosts(tab: str, author: str, page: int):
    return postsHelper(tab=tab, page=page, author=author)


def postsHelper(tab: str, page: int, author: str | None = None):
    if tab in ["newest", "popular", "replies"]:
        isPopular = tab == "popular"
        isReplies = tab == "replies"
        return get_saved_posts(
            limit=10, page=page, popular=isPopular, author=author, isReplies=isReplies
        )
    else:
        return {"error": "Incorrect tab"}
