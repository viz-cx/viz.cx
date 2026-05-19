import datetime as dt

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from helpers.editorjs_validator import validate_editorjs_blocks
from helpers.mongo import (
    get_post_thread,
    get_posts_by_tag,
    get_saved_post,
    get_saved_posts,
    save_local_post,
    update_local_post,
)
from helpers.signature_auth import require_signed_request

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


class PostCreated(BaseModel):
    id: str


class PostUpdated(BaseModel):
    ok: bool


@router.post("/", response_model=PostCreated)
def create_post(
    body: CreatePostBody,
    account: str = Depends(require_signed_request),
) -> PostCreated:
    validate_editorjs_blocks(body.blocks)
    post = {
        "author": account,
        "block": 0,
        "blocks": body.blocks,
        "d": {"t": _extract_text(body.blocks)},
        "source": "local",
        "editable": True,
        "timestamp": dt.datetime.now(dt.UTC),
        "shares": 0.0,
        "awards": 0,
        "comments": 0,
    }
    if body.reply:
        post["d"]["r"] = body.reply
    post_id = save_local_post(post)
    return PostCreated(id=post_id)


@router.put("/{post_id}", response_model=PostUpdated)
def update_post(
    post_id: str,
    body: UpdatePostBody,
    account: str = Depends(require_signed_request),
) -> PostUpdated:
    validate_editorjs_blocks(body.blocks)
    if not update_local_post(post_id, body.blocks, account):
        raise HTTPException(status_code=404, detail="Post not found or not editable")
    return PostUpdated(ok=True)


def _extract_text(blocks: list) -> str:
    parts = []
    for block in blocks:
        data = block.get("data", {})
        if block.get("type") == "paragraph" or block.get("type") == "header":
            parts.append(data.get("text", ""))
    return "\n\n".join(parts)[:280] if parts else ""


@router.get("/@{author}/{block}")
def post(author: str, block: int):
    return get_saved_post(author, block)


@router.get("/comments/@{author}/{block}")
def comments(author: str, block: int):
    return get_post_thread(author=author, block=block)


@router.get("/tags/{tag}")
def tags(tag: str):
    return get_posts_by_tag(tag=tag)


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
