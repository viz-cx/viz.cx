import datetime
import json
from time import sleep
from typing import Literal, NoReturn

from pydantic import BaseModel

from helpers.mongo import (
    get_last_saved_post_block_id,
    get_post_comments,
    get_readdleme_post_awards_and_shares,
    get_saved_posts,
    get_voice_posts,
    save_voice_post,
    update_post_comments,
)


def start_posts_parsing() -> NoReturn:
    update_posts_comments_count()
    while True:
        try:
            last_block_id = get_last_saved_post_block_id()
            blocks_with_new_posts = get_voice_posts(from_block=last_block_id)
            for block in blocks_with_new_posts:
                posts = fetch_posts_from_block(block)
                for post in posts:
                    save_voice_post(post)
        except Exception as e:
            print(f"Posts parsing error: {str(e)}")
            sleep(3)


def update_posts_comments_count() -> None:
    page = 0
    while True:
        posts = get_saved_posts(page=page, limit=1000, isReplies=None, showId=True)
        page += 1
        if not posts:
            break
        for post in posts:
            author = post["author"]
            block = post["block"]
            comments = get_post_comments(author=author, block=block)
            commentCount = len(comments)
            postCommentsCount = post.get("comments", 0)
            if commentCount != postCommentsCount:
                update_post_comments(postId=post["_id"], comments=commentCount)
    print("Post comments updated successfully")


def fetch_posts_from_block(block) -> list:
    result = []
    for transaction in block["block"]:
        try:
            op = transaction["op"]
            if op[0] != "custom" or op[1]["id"] != "V":
                continue
            author = op[1]["required_regular_auths"][0]
            js = json.loads(op[1]["json"])
            post = VoiceProtocol(**js)
            if post.d.t is None and post.d.text is not None:
                post.d.t = post.d.text
            post.d.text = None
            assert isinstance(author, str), "author must be a string"
            assert isinstance(block["_id"], int), "block ID must be an integer"
            post.author = author
            post.block = block["_id"]
            post.timestamp = transaction["timestamp"]
            assert isinstance(post.block, int), "post.block must be an integer"
            meta = get_readdleme_post_awards_and_shares(post.author, post.block)
            post.shares = meta["shares"]
            comments = get_post_comments(author=post.author, block=post.block)
            post.comments = len(comments)
            if post.d.t is None:
                print(f"Skip post: {post.author}/{post.block}")
            else:
                print(f"New post: {post.author}/{post.block}")
                post_dict = post.model_dump(exclude_none=True)
                post_dict["blocks"] = voice_to_editorjs_blocks(post_dict.get("d", {}))
                post_dict["source"] = "blockchain"
                post_dict["editable"] = False
                result.append(post_dict)
        except Exception as e:
            print(f"Parse post error: {str(e)}")
            continue
    return result


def voice_to_editorjs_blocks(post_data: dict) -> list:
    blocks = []

    if post_data.get("m"):
        blocks.extend(_markdown_to_blocks(post_data["m"]))
    elif post_data.get("t"):
        paragraphs = post_data["t"].strip().split("\n\n")
        for p in paragraphs:
            p = p.strip()
            if p:
                blocks.append({"type": "paragraph", "data": {"text": p.replace("\n", "<br>")}})

    if post_data.get("i"):
        blocks.append({"type": "image", "data": {"file": {"url": post_data["i"]}, "caption": ""}})

    if post_data.get("s"):
        blocks.append({"type": "paragraph", "data": {"text": f'<a href="{post_data["s"]}">{post_data["s"]}</a>'}})

    return blocks


def _markdown_to_blocks(text: str) -> list:
    blocks = []
    text = text.strip().replace("\r", "")
    while "\n\n\n" in text:
        text = text.replace("\n\n\n", "\n\n")
    parts = text.split("\n\n")

    for part in parts:
        part = part.strip()
        if not part:
            continue

        if part == "***":
            blocks.append({"type": "delimiter", "data": {}})
            continue

        first = part.split(" ", 1)[0] if " " in part else ""
        content = part.split(" ", 1)[1] if " " in part else part

        if first == "##":
            blocks.append({"type": "header", "data": {"text": content, "level": 2}})
        elif first == "###":
            blocks.append({"type": "header", "data": {"text": content, "level": 3}})
        elif first == ">>" or first == ">":
            blocks.append({"type": "quote", "data": {"text": content}})
        elif first == "*":
            items = [line.lstrip("* ") for line in part.split("\n")]
            blocks.append({"type": "list", "data": {"style": "unordered", "items": items}})
        elif first == "*n":
            items = [line.lstrip("*n ") for line in part.split("\n")]
            blocks.append({"type": "list", "data": {"style": "ordered", "items": items}})
        else:
            blocks.append({"type": "paragraph", "data": {"text": part.replace("\n", "<br>")}})

    return blocks


class Benificiary(BaseModel):
    account: str
    weight: int


class ShortPost(BaseModel):
    t: str | None = None  # text or title
    text: str | None = None  # backward compatibility, only for parsing
    r: str | None = None  # reply
    s: str | None = None  # share
    i: str | None = None  # image
    b: list[Benificiary] | None = None  # benificiaries

    def __repr__(self) -> str:
        return f"<ShortPost(t={self.t!r})>"


class ExtendedPost(ShortPost):
    m: str  # markdown
    d: str | None = None  # description

    def __repr__(self) -> str:
        return f"<ExtendedPost(t={self.t!r})>"


class VoiceProtocol(BaseModel):
    """https://github.com/VIZ-Blockchain/Free-Speech-Project/blob/master/specification.md"""

    p: int | None = None  # previous
    t: Literal["t", "text", "p"] | None = None  # type
    d: ExtendedPost | ShortPost  # data
    v: int | None = None  # version

    # additional data
    author: str | None = None
    block: int | None = None
    timestamp: datetime.datetime | None = None
    shares: float | None = None
    comments: int | None = None
