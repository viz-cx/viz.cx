import datetime
import json
from time import sleep
from typing import Literal, NoReturn, Optional
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
            print("Posts parsing error: {}".format(str(e)))
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
            postCommentsCount = post["comments"] if "comments" in post else 0
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
            post.author = author
            post.block = block["_id"]
            post.timestamp = transaction["timestamp"]
            meta = get_readdleme_post_awards_and_shares(post.author, post.block)
            post.shares = meta["shares"]
            post.comments = 0
            if post.d.t is None:  # validation
                print("Skip post: {}/{}".format(post.author, post.block))
            else:
                print("New post: {}/{}".format(post.author, post.block))
                result.append(post.model_dump(exclude_none=True))
        except Exception as e:
            print("Parse post error: {}".format(str(e)))
            continue
    return result


class Benificiary(BaseModel):
    account: str
    weight: int


class ShortPost(BaseModel):
    t: Optional[str] = None  # text or title
    text: Optional[str] = None  # backward compatibility, only for parsing
    r: Optional[str] = None  # reply
    s: Optional[str] = None  # share
    i: Optional[str] = None  # image
    b: Optional[list[Benificiary]] = None  # benificiaries

    def __repr__(self) -> str:
        return "<ShortPost(t={self.t!r})>".format(self=self)


class ExtendedPost(ShortPost):
    m: str  # markdown
    d: Optional[str] = None  # description

    def __repr__(self) -> str:
        return "<ExtendedPost(t={self.t!r})>".format(self=self)


class VoiceProtocol(BaseModel):
    """https://github.com/VIZ-Blockchain/Free-Speech-Project/blob/master/specification.md"""

    p: Optional[int] = None  # previous
    t: Optional[Literal["t", "text", "p"]] = None  # type
    d: ExtendedPost | ShortPost  # data
    v: Optional[int] = None  # version

    # additional data
    author: Optional[str] = None
    block: Optional[int] = None
    timestamp: Optional[datetime.datetime] = None
    shares: Optional[float] = None
    comments: Optional[int] = None
