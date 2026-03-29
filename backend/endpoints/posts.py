import datetime as dt
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from helpers.auth import verify_user
from helpers.editorjs_validator import validate_editorjs_blocks
from helpers.mongo import (
    get_post_comments,
    get_posts_by_tag,
    get_saved_posts,
    get_saved_post,
    save_local_post,
    update_local_post,
)

router = APIRouter(
    prefix="/posts",
    tags=["Posts"],
    responses={404: {"description": "Not found"}},
)


class CreatePostBody(BaseModel):
    blocks: list
    reply: str | None = None


class UpdatePostBody(BaseModel):
    blocks: list


@router.post("/")
def create_post(
    body: CreatePostBody,
    x_login: str = Header(),
    x_public_key: str = Header(),
):
    if not verify_user(x_login, x_public_key):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    validate_editorjs_blocks(body.blocks)
    post = {
        "author": x_login,
        "block": 0,
        "blocks": body.blocks,
        "d": {"t": _extract_text(body.blocks)},
        "source": "local",
        "editable": True,
        "timestamp": dt.datetime.utcnow(),
        "shares": 0.0,
        "awards": 0,
        "comments": 0,
    }
    if body.reply:
        post["d"]["r"] = body.reply
    post_id = save_local_post(post)
    return {"id": post_id}


@router.put("/{post_id}")
def update_post(
    post_id: str,
    body: UpdatePostBody,
    x_login: str = Header(),
    x_public_key: str = Header(),
):
    if not verify_user(x_login, x_public_key):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    validate_editorjs_blocks(body.blocks)
    if not update_local_post(post_id, body.blocks):
        raise HTTPException(status_code=404, detail="Post not found or not editable")
    return {"ok": True}


def _extract_text(blocks: list) -> str:
    parts = []
    for block in blocks:
        data = block.get("data", {})
        if block.get("type") == "paragraph":
            parts.append(data.get("text", ""))
        elif block.get("type") == "header":
            parts.append(data.get("text", ""))
    return "\n\n".join(parts)[:280] if parts else ""


@router.get("/@{author}/{block}")
def post(author: str, block: int):
    return get_saved_post(author, block)


@router.get("/comments/@{author}/{block}")
def comments(author: str, block: int):
    comments = addReplies(author=author, block=block)
    return comments


@router.get("/tags/{tag}")
def tags(tag: str):
    return get_posts_by_tag(tag=tag)


def addReplies(author: str, block: int):
    comments = get_post_comments(author=author, block=block)
    for comment in comments:
        if isinstance(comment, dict):
            repliesCount = comment["comments"] if "comments" in comment else 0
            if repliesCount > 0:
                comment["replies"] = addReplies(
                    author=comment["author"], block=comment["block"]
                )
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
