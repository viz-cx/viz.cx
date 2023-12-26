import datetime
import json
from typing import Literal, Optional
from pydantic import BaseModel

from helpers.mongo import (
    get_last_saved_post_block_id,
    get_voice_posts,
    save_voice_post,
)


def fetch_new_updates():
    try:
        last_block_id = get_last_saved_post_block_id()
        blocks_with_new_posts = get_voice_posts(from_block=last_block_id)
        for block in blocks_with_new_posts:
            posts = fetch_posts_from_block(block)
            for post in posts:
                save_voice_post(post)
    except Exception as e:
        print("Posts error: {}".format(str(e)))


def fetch_posts_from_block(block):
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
            if post.d.t is None:  # validation
                print("Skip post: @{}/{}".format(post.author, post.block))
            else:
                print("New post: @{}/{}".format(post.author, post.block))
                result.append(post.dict(exclude_none=True))
        except Exception as e:
            print("Parse post error: {}".format(str(e)))
            continue
    return result


class Benificiary(BaseModel):
    account: str
    weight: int


class ShortPost(BaseModel):
    t: Optional[str]  # title
    text: Optional[str]  # backward compatibility, only for parsing
    r: Optional[str]  # reply
    s: Optional[str]  # share
    b: Optional[list[Benificiary]]  # benificiaries

    def __repr__(self) -> str:
        return "<ShortPost(t={self.t!r})>".format(self=self)


class ExtendedPost(ShortPost):
    m: str  # markdown
    d: Optional[str]  # description
    i: Optional[str]  # image

    def __repr__(self) -> str:
        return "<ExtendedPost(t={self.t!r})>".format(self=self)


class VoiceProtocol(BaseModel):
    """https://github.com/VIZ-Blockchain/Free-Speech-Project/blob/master/specification.md"""

    p: Optional[int]  # previous
    t: Optional[Literal["t", "text", "p"]]  # type
    d: ExtendedPost | ShortPost  # data
    v: Optional[int]  # version

    # additional data
    author: Optional[str]
    block: Optional[int]
    timestamp: Optional[datetime.datetime]
