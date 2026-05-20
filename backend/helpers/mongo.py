"""Helper module for working with MongoDB"""

import datetime as dt
import json
import logging
import os
import re
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor

import pymongo
from bson import ObjectId

from helpers.db_client import get_db
from helpers.enums import OpType, ops_custom, ops_shares
from helpers.viz import convertShares

logger = logging.getLogger(__name__)

_meta_executor: ThreadPoolExecutor | None = None
_VIZ_URI_RE = re.compile(r"viz://@([a-z0-9\-\.]+)/(\d+)")


def _meta_executor_singleton() -> ThreadPoolExecutor:
    global _meta_executor
    if _meta_executor is None:
        max_workers = int(os.getenv("META_RECALC_WORKERS", "2"))
        _meta_executor = ThreadPoolExecutor(
            max_workers=max_workers, thread_name_prefix="meta-recalc"
        )
    return _meta_executor


def _db():
    return get_db()


class _CollProxy:
    """Lazy attribute proxy. Resolves to the underlying collection on access."""

    def __init__(self, name_env: str, default: str = ""):
        self._name_env = name_env
        self._default = default

    def _resolve(self):
        return _db()[os.getenv(self._name_env, self._default)]

    def __getattr__(self, item):
        return getattr(self._resolve(), item)

    def __getitem__(self, key):
        return self._resolve()[key]


coll = _CollProxy("COLLECTION")
coll_posts = _CollProxy("COLLECTION_POSTS", "posts")
coll_ops = _CollProxy("COLLECTION_OPS")


def _coll_custom():
    return coll_ops[OpType.custom]


count_max_ops_in_block = 100_000
sorted_op_types = ops_custom + ops_shares
site_account = "cx.id"


# ---------------------------------------------------------------------------
# Block I/O (raw blockchain data, indexer-facing)
# ---------------------------------------------------------------------------


def save_block(block) -> None:
    """Save block to MongoDB collection."""
    blocknumber = block[0]["block"]
    for tx in block:
        tx.pop("block")
        if tx.get("trx_id") == "0000000000000000000000000000000000000000":
            tx.pop("trx_id")
        tx_t = dt.datetime.fromisoformat(tx.get("timestamp"))
        tx.update({"timestamp": tx_t})
    coll.insert_one({"block": block, "_id": blocknumber})


def get_block(id: int) -> dict:
    """Return block by id from collection in MongoDB database."""
    result = coll.find({"_id": id}).limit(1)
    return tuple(result)[0]


def get_last_block() -> dict:
    """Return last block from collection in MongoDB database."""
    result = coll.find({}).sort("_id", pymongo.DESCENDING).limit(1)
    return tuple(result)[0]


def get_last_blocknum() -> int:
    """Return number of last block from collection in MongoDB
    database."""
    result = get_last_block()
    blocknum = int(result["_id"])
    return blocknum


def get_last_blocknum_and_subcoll() -> dict:
    """Returns collection name and number of last block from
    subcollections."""
    bnum_max = 0
    subcoll_bnum_max = None
    for coll_op in sorted_op_types:
        result = tuple(
            coll_ops[coll_op]
            .find({}, {"_id": 1})
            .sort("_id", pymongo.DESCENDING)
            .limit(1)
        )
        if len(result) != 0:
            bnum_max_in_coll = result[0]["_id"]
            if bnum_max_in_coll > bnum_max:
                bnum_max = int(bnum_max_in_coll)
                subcoll_bnum_max = coll_ops[coll_op]
    result = tuple(
        coll_ops.find({}, {"_id": 1}).sort("_id", pymongo.DESCENDING).limit(1)
    )
    if len(result) != 0:
        bnum_max_in_coll = result[0]["_id"]
        if bnum_max_in_coll > bnum_max:
            bnum_max = int(bnum_max_in_coll)
            subcoll_bnum_max = coll_ops
    return {"last_block_num": bnum_max, "collection": subcoll_bnum_max}


# ---------------------------------------------------------------------------
# Sorter / op-counter (cross-cuts blocks, ops subcollections, post metadata)
# ---------------------------------------------------------------------------


def sort_block_ops_to_subcolls(block_n_num) -> None:
    """Divide block to subcollection by operations. SHARES and CUSTOM ops:
    to separate subcollections. And 'ops' collection for unsorted others.
    Also emits rollup deltas and pubsub events for WS subscribers.

    Inserts are batched per op-type collection (one insert_many each) so a
    block with N ops costs O(types) round trips instead of O(N). Meta
    recalculation (extra DB reads + writes) is deferred to a background
    executor so it never blocks the sorter."""
    from helpers import pubsub, rollups, webhooks

    op_number = 0.0
    block_number = block_n_num["_id"]
    block = block_n_num["block"]
    by_type: dict[str, list[dict]] = defaultdict(list)
    not_sorted_ops: list[dict] = []
    rollup_ops: list[dict] = []
    meta_ops: list[dict] = []
    for op in block:
        op_number += 1 / count_max_ops_in_block
        op_type = op["op"][0]
        if op_type in ops_shares:
            op["op"][1]["shares"] = convertShares(op["op"][1]["shares"])
        op_new_json = {
            "_id": block_number + op_number,
            "timestamp": op["timestamp"],
            "op": op["op"],
        }
        if op_type in sorted_op_types:
            by_type[op_type].append(op_new_json)
            if _needs_meta_recalc(op):
                meta_ops.append(op)
        else:
            not_sorted_ops.append(op_new_json)
        rollup_ops.append(op_new_json)
        pubsub.publish_op(op_new_json)
        webhooks.dispatch(op_new_json)
    for op_type, docs in by_type.items():
        coll_ops[op_type].insert_many(docs)
    if not_sorted_ops:
        coll_ops.insert_many(not_sorted_ops)
    rollups.aggregate_ops(rollup_ops)
    if meta_ops:
        executor = _meta_executor_singleton()
        for op in meta_ops:
            executor.submit(_recalc_meta_safe, op)


def _needs_meta_recalc(op) -> bool:
    op_type = op["op"][0]
    if op_type == OpType.receive_award:
        return op["op"][1].get("memo", "").startswith("viz://")
    if op_type == OpType.custom:
        return op["op"][1].get("id") == "V"
    return False


def _recalc_meta_safe(op) -> None:
    try:
        recalculate_meta_if_needed(op)
    except Exception:
        logger.exception("recalculate_meta_if_needed failed")


def recalculate_meta_if_needed(op) -> None:
    op_type = op["op"][0]
    if op_type == OpType.receive_award and op["op"][1]["memo"].startswith("viz://"):
        try:
            result = _VIZ_URI_RE.search(op["op"][1]["memo"])
            if result is not None:
                author = result.group(1)
                block = int(result.group(2))
                meta = get_readdleme_post_awards_and_shares(author, block)
                update_post_meta_if_needed(
                    author, block, meta["awards"], meta["shares"]
                )
        except Exception as e:
            logger.warning("Shares recalculation error: %s", e)

    if op_type == OpType.custom and op["op"][1]["id"] == "V":
        try:
            js = json.loads(op["op"][1]["json"])
            if "d" in js and "r" in js["d"]:
                result = _VIZ_URI_RE.search(js["d"]["r"])
                if result is not None:
                    author = result.group(1)
                    block = int(result.group(2))
                    post = get_saved_post(author, block, show_id=True)
                    if isinstance(post, dict):
                        comments = get_post_comments(author=author, block=block)
                        update_post_comments(post["_id"], comments=len(comments))
        except Exception as e:
            logger.warning("Replies recalculation error: %s", e)


# Количество всех блоков в БД.
def get_all_blocks_count() -> int:
    """Return number of all blocks in the database."""
    result = coll.estimated_document_count({})
    return result


# ---------------------------------------------------------------------------
# Leaderboards (Telegram + Voice) — shared aggregation primitives
# ---------------------------------------------------------------------------
#
# Two pipeline shapes are used across all leaderboard endpoints:
#   1. _top_memo_leaderboard:   $match memo prefix → $group by key → top-N.
#   2. _memo_awards_and_shares: $match memo filter → $group all → one row.
#
# `coll_ops[OpType.receive_award]` is the source for everything below: every
# receive_award op carries `op.memo` (an array of strings), and the prefix
# distinguishes channels from voice posts.


_MEMO_FULL = "$op.memo"
_MEMO_TG_CHANNEL = {
    # split "channel:@chan:postid" by ":" and take index 1 ("@chan").
    "$arrayElemAt": [
        {"$split": [{"$arrayElemAt": ["$op.memo", 0]}, ":"]},
        1,
    ]
}
_MEMO_VOICE_AUTHOR = {
    # split "viz://@author/block" by "/" and take index 2 ("@author").
    "$arrayElemAt": [
        {"$split": [{"$arrayElemAt": ["$op.memo", 0]}, "/"]},
        2,
    ]
}


def _metric_accumulator(metric: str) -> dict:
    if metric == "shares":
        return {"$sum": {"$sum": "$op.shares"}}
    if metric == "awards":
        return {"$sum": 1}
    raise ValueError(f"unknown metric: {metric}")


def _top_memo_leaderboard(
    *,
    memo_regex: str,
    from_date: dt.datetime,
    to_date: dt.datetime,
    in_top: int,
    to_skip: int,
    metric: str,
    group_id,
) -> list[dict]:
    """Run the standard top-N memo-leaderboard pipeline and return raw rows.

    Each row is `{"_id": <key>, "value": <metric>}`. Callers format the label
    (post link / channel link / account name) from `_id` and rename `value`
    to whatever the response shape demands."""
    pipeline = [
        {
            "$match": {
                "timestamp": {"$gt": from_date, "$lt": to_date},
                "op.memo": {"$regex": memo_regex},
            }
        },
        {"$group": {"_id": group_id, "value": _metric_accumulator(metric)}},
        {"$sort": {"value": -1}},
        {"$skip": to_skip},
        {"$limit": in_top},
    ]
    return list(coll_ops[OpType.receive_award].aggregate(pipeline))


def _memo_awards_and_shares(
    *,
    memo_filter,
    from_date: dt.datetime,
    to_date: dt.datetime,
) -> dict:
    """Aggregate `{awards, shares}` totals for a single memo filter
    (either an exact match or a `{"$regex": ...}`). Returns zeros on no
    match rather than an empty pipeline result."""
    pipeline = [
        {
            "$match": {
                "timestamp": {"$gt": from_date, "$lt": to_date},
                "op.memo": memo_filter,
            }
        },
        {
            "$group": {
                "_id": None,
                "awards": {"$sum": 1},
                "shares": {"$sum": {"$sum": "$op.shares"}},
            }
        },
    ]
    result = list(coll_ops[OpType.receive_award].aggregate(pipeline))
    if not result:
        return {"awards": 0, "shares": 0}
    return {"awards": int(result[0]["awards"]), "shares": result[0]["shares"]}


def _tg_post_link_from_memo(memo) -> str:
    return memo[0].replace(":", "/", 2).replace("channel/@", "https://t.me/", 1)


def _tg_channel_link(channel: str) -> str:
    return channel.replace("@", "https://t.me/", 1)


def _default_week_window(
    to_date: dt.datetime | None, from_date: dt.datetime | None
) -> tuple[dt.datetime, dt.datetime]:
    """Resolve (to, from) defaults to (now, now - 1 week). Replaces the
    legacy `dt.datetime.now()` mutable-default pattern."""
    if to_date is None:
        to_date = dt.datetime.now()
    if from_date is None:
        from_date = to_date - dt.timedelta(weeks=1)
    return to_date, from_date


# ---------------------------------------------------------------------------
# Telegram leaderboards
# ---------------------------------------------------------------------------


_TG_MEMO_REGEX = "^channel:@"


def get_top_tg_posts_by_shares_in_period(
    to_date: dt.datetime,
    from_date: dt.datetime,
    in_top: int,
    to_skip: int,
) -> list:
    """Return top Telegram posts by shares."""
    rows = _top_memo_leaderboard(
        memo_regex=_TG_MEMO_REGEX,
        from_date=from_date, to_date=to_date,
        in_top=in_top, to_skip=to_skip,
        metric="shares", group_id=_MEMO_FULL,
    )
    return [{"post": _tg_post_link_from_memo(r["_id"]), "value": r["value"]} for r in rows]


def get_top_tg_ch_by_shares_in_period(
    to_date: dt.datetime | None = None,
    from_date: dt.datetime | None = None,
    in_top: int = 5,
    to_skip: int = 0,
) -> list:
    """Return top Telegram channels by received SHARES."""
    to_date, from_date = _default_week_window(to_date, from_date)
    rows = _top_memo_leaderboard(
        memo_regex=_TG_MEMO_REGEX,
        from_date=from_date, to_date=to_date,
        in_top=in_top, to_skip=to_skip,
        metric="shares", group_id=_MEMO_TG_CHANNEL,
    )
    return [{"channel": _tg_channel_link(r["_id"]), "value": r["value"]} for r in rows]


def get_top_tg_posts_by_awards_count_in_period(
    to_date: dt.datetime | None = None,
    from_date: dt.datetime | None = None,
    in_top: int = 5,
    to_skip: int = 0,
) -> list:
    """Return top Telegram posts by awards count."""
    to_date, from_date = _default_week_window(to_date, from_date)
    rows = _top_memo_leaderboard(
        memo_regex=_TG_MEMO_REGEX,
        from_date=from_date, to_date=to_date,
        in_top=in_top, to_skip=to_skip,
        metric="awards", group_id=_MEMO_FULL,
    )
    return [{"post": _tg_post_link_from_memo(r["_id"]), "value": r["value"]} for r in rows]


def get_tg_ch_post_awards_and_shares_in_period(
    tg_ch_post_link: str = "https://t.me/viz_news/80",
    to_date: dt.datetime | None = None,
    from_date: dt.datetime | None = None,
) -> dict:
    """Return telegram channel post awards count and received SHARES in period"""
    to_date, from_date = _default_week_window(to_date, from_date)
    memo_post_link = "channel:@" + tg_ch_post_link.split("t.me/", 1)[-1].replace("/", ":")
    totals = _memo_awards_and_shares(
        memo_filter=memo_post_link, from_date=from_date, to_date=to_date,
    )
    return {"post_link": tg_ch_post_link, **totals}


def get_top_tg_chs_by_awards_count_in_period(
    to_date: dt.datetime | None = None,
    from_date: dt.datetime | None = None,
    in_top: int = 5,
    to_skip: int = 0,
) -> list:
    """Return top telegram channels by awards count."""
    to_date, from_date = _default_week_window(to_date, from_date)
    rows = _top_memo_leaderboard(
        memo_regex=_TG_MEMO_REGEX,
        from_date=from_date, to_date=to_date,
        in_top=in_top, to_skip=to_skip,
        metric="awards", group_id=_MEMO_TG_CHANNEL,
    )
    return [{"channel": _tg_channel_link(r["_id"]), "value": r["value"]} for r in rows]


def get_tg_ch_awards_and_shares_in_period(
    tg_ch_id: str = "@viz_news",
    to_date: dt.datetime | None = None,
    from_date: dt.datetime | None = None,
) -> dict:
    """Return SHARES and awards received by telegram channel."""
    to_date, from_date = _default_week_window(to_date, from_date)
    totals = _memo_awards_and_shares(
        memo_filter={"$regex": "^channel:" + tg_ch_id},
        from_date=from_date, to_date=to_date,
    )
    return {"channel": tg_ch_id, **totals}


# ---------------------------------------------------------------------------
# Voice (readdle.me) leaderboards + post metadata
# ---------------------------------------------------------------------------


_VOICE_MEMO_REGEX = "^viz://@"


def get_top_readdleme_posts_by_shares_in_period(
    to_date: dt.datetime,
    from_date: dt.datetime,
    in_top: int,
    to_skip: int,
) -> list:
    """Return top Readdle.Me posts by SHARES."""
    rows = _top_memo_leaderboard(
        memo_regex=_VOICE_MEMO_REGEX,
        from_date=from_date, to_date=to_date,
        in_top=in_top, to_skip=to_skip,
        metric="shares", group_id=_MEMO_FULL,
    )
    return [{"post": r["_id"][0], "value": r["value"]} for r in rows]


def get_readdleme_post_awards_and_shares(author: str, block: int) -> dict:
    """Return Voice post awards count and received SHARES"""
    memo_post_link = f"viz://@{author}/{block}"
    regex = "^" + re.escape(memo_post_link) + "($|\\/)"
    result = coll_ops[OpType.receive_award].aggregate(
        [
            {
                "$match": {
                    "op.memo": {"$regex": regex},
                }
            },
            {
                "$group": {
                    "_id": "$op.receiver",
                    "awards": {"$sum": {"$sum": 1}},
                    "shares": {"$sum": {"$sum": "$op.shares"}},
                }
            },
        ]
    )
    result = tuple(result)
    awards: int = 0
    shares: float = 0
    for r in result:
        if r["_id"][0] == site_account:
            awards += r["awards"]
            shares -= r["shares"]
        elif r["_id"][0] == author:
            awards += r["awards"]
            shares += r["shares"]
    update_post_meta_if_needed(author, block, awards, shares)
    result = {"awards": awards, "shares": shares, "post_link": memo_post_link}
    return result


def update_post_meta_if_needed(
    author: str, block: int, awards: int, shares: float
) -> None:
    post = get_saved_post(author, block, show_id=True)
    if isinstance(post, dict):
        postAwards: int = post.get("awards", 0)
        postShares: float = post.get("shares", 0.0)
        if awards != postAwards or postShares != shares:
            coll_posts.find_one_and_update(
                {"_id": post["_id"]},
                {"$set": {"awards": awards, "shares": shares}},
            )
            print(
                f"New {awards} awards and {shares} shares for post {author}/{block}"
            )


def get_top_readdleme_authors_by_shares_in_period(
    to_date: dt.datetime,
    from_date: dt.datetime,
    in_top: int,
    to_skip: int,
) -> list:
    """Return top Readdle.Me authors by SHARES."""
    rows = _top_memo_leaderboard(
        memo_regex=_VOICE_MEMO_REGEX,
        from_date=from_date, to_date=to_date,
        in_top=in_top, to_skip=to_skip,
        metric="shares", group_id=_MEMO_VOICE_AUTHOR,
    )
    return [{"account": r["_id"], "value": r["value"]} for r in rows]


def get_top_readdleme_posts_by_awards_in_period(
    to_date: dt.datetime,
    from_date: dt.datetime,
    in_top: int,
    to_skip: int,
) -> list:
    """Return top Readdle.Me posts by awards count."""
    rows = _top_memo_leaderboard(
        memo_regex=_VOICE_MEMO_REGEX,
        from_date=from_date, to_date=to_date,
        in_top=in_top, to_skip=to_skip,
        metric="awards", group_id=_MEMO_FULL,
    )
    return [{"post": r["_id"][0], "value": r["value"]} for r in rows]


def get_top_readdleme_authors_by_awards_in_period(
    to_date: dt.datetime,
    from_date: dt.datetime,
    in_top: int,
    to_skip: int,
) -> list:
    """Return top Readdle.Me authors by awards count."""
    rows = _top_memo_leaderboard(
        memo_regex=_VOICE_MEMO_REGEX,
        from_date=from_date, to_date=to_date,
        in_top=in_top, to_skip=to_skip,
        metric="awards", group_id=_MEMO_VOICE_AUTHOR,
    )
    return [{"account": r["_id"], "value": r["value"]} for r in rows]


def get_readdleme_author_awards_and_shares_in_period(
    readdleme_author_id: str = "@inov8",
    to_date: dt.datetime | None = None,
    from_date: dt.datetime | None = None,
) -> dict:
    """Return Readdle.Me author awards count and received SHARES in period."""
    to_date, from_date = _default_week_window(to_date, from_date)
    totals = _memo_awards_and_shares(
        memo_filter={"$regex": "^viz://" + readdleme_author_id},
        from_date=from_date, to_date=to_date,
    )
    return {"account": readdleme_author_id, **totals}


# ---------------------------------------------------------------------------
# Local posts (Voice protocol + EditorJS) — CRUD, thread walking, queries
# ---------------------------------------------------------------------------


def get_last_saved_post_block_id() -> int:
    try:
        result = coll_posts.find({}).sort("block", pymongo.DESCENDING).limit(1)
        post = tuple(result)[0]
        return int(post["block"])
    except IndexError:
        return 17740800  # 17740801 is the first block with voice protocol post


def get_voice_posts(from_block, limit=10):
    result = coll.find(
        {"_id": {"$gt": from_block}, "block.op.0": "custom", "block.op.1.id": "V"}
    ).limit(limit)
    return tuple(result)


def save_voice_post(post):
    coll_posts.insert_one(post)


def postsQuery(
    author: str | None = None, block: int | None = None, isReplies: bool | None = None
) -> dict:
    regex = {"$regex": "^viz://"}
    query = {
        "d.t": {"$exists": True},
        "d.s": {"$not": regex},
    }
    if isReplies is None:
        pass
    elif isReplies:
        query["d.r"] = regex
    elif not isReplies:
        query["d.r"] = {"$not": regex}

    if author:
        query["author"] = author
    if block:
        query["block"] = block
    return query


def get_saved_posts(
    limit=10,
    page=0,
    popular: bool = False,
    author: str | None = None,
    isReplies: bool | None = False,
    showId: bool = False,
):
    field = "shares" if popular else "block"
    cursor = (
        coll_posts.find(  # "t": {"$in": ["p"]}
            postsQuery(author=author, isReplies=isReplies),
            {} if showId else {"_id": 0},
        )
        .sort(field, pymongo.DESCENDING)
        .limit(limit)
        .skip(limit * page)
    )
    return tuple(cursor)


def get_posts_by_tag(tag: str, limit=10, page=0):
    # query = {"$text": {"$search": '"#{} "'.format(tag)}}
    # cursor = (
    #     coll_posts.find(query, {"_id": 0})
    #     .sort("block", pymongo.DESCENDING)
    #     .limit(limit)
    #     .skip(limit * page)
    # )
    # return tuple(cursor)
    return tuple()


def get_post_comments(author: str, block: int):
    replyRegex = {"$regex": f"^viz://@{author}/{block}"}
    cursor = coll_posts.find(
        {"d.r": replyRegex},
        {"_id": 0},
    ).sort("block", pymongo.DESCENDING)
    return tuple(cursor)


def _post_uri(author: str, block: int) -> str:
    return f"viz://@{author}/{block}"


def get_post_thread(author: str, block: int, max_depth: int = 50) -> list:
    """Return all descendants of (author, block) as a nested tree in one
    pass per depth level (BFS), instead of N+1 queries per node.

    The previous implementation called get_post_comments() for every node,
    producing depth × fanout queries. This walks the tree level-by-level
    with a single $or query per level.
    """
    root_uri = _post_uri(author, block)
    direct = coll_posts.find(
        {"d.r": {"$regex": "^" + re.escape(root_uri) + "($|/)"}},
        {"_id": 0},
    ).sort("block", pymongo.DESCENDING)
    nodes_by_uri: dict[str, dict] = {}
    children: dict[str, list[dict]] = {}
    frontier: list[dict] = [dict(d) for d in direct]
    for node in frontier:
        uri = _post_uri(node["author"], node["block"])
        nodes_by_uri[uri] = node
        children.setdefault(node["d"]["r"], []).append(node)

    depth = 1
    while frontier and depth < max_depth:
        child_uris = [_post_uri(n["author"], n["block"]) for n in frontier]
        next_level_query = {
            "d.r": {"$in": child_uris},
        }
        next_level = list(coll_posts.find(next_level_query, {"_id": 0}).sort(
            "block", pymongo.DESCENDING
        ))
        if not next_level:
            break
        for node in next_level:
            uri = _post_uri(node["author"], node["block"])
            if uri in nodes_by_uri:
                continue
            nodes_by_uri[uri] = dict(node)
            children.setdefault(node["d"]["r"], []).append(nodes_by_uri[uri])
        frontier = next_level
        depth += 1

    for uri, node in nodes_by_uri.items():
        kids = children.get(uri, [])
        if kids:
            node["replies"] = kids

    return children.get(root_uri, [])


def get_saved_post(author: str, block: int, show_id=False):
    post = coll_posts.find_one(
        postsQuery(author=author, block=block),
        {} if show_id else {"_id": 0},
    )
    return post


def update_post_comments(postId: ObjectId, comments: int):
    coll_posts.find_one_and_update(
        {"_id": postId},
        {"$set": {"comments": comments}},
    )
    print(f"Update post {str(postId)} to {comments} comments")


def save_local_post(post: dict) -> str:
    result = coll_posts.insert_one(post)
    return str(result.inserted_id)


def update_local_post(post_id: str, blocks: list, author: str | None = None) -> bool:
    """Update a local post. If `author` is given, only update if the post
    was created by that author (prevents cross-account edits)."""
    query: dict = {"_id": ObjectId(post_id), "editable": True}
    if author is not None:
        query["author"] = author
    result = coll_posts.find_one_and_update(
        query,
        {"$set": {"blocks": blocks, "updated_at": dt.datetime.now(dt.UTC)}},
    )
    return result is not None


def get_saved_post_by_id(local_id: str):
    return coll_posts.find_one({"_id": ObjectId(local_id)}, {"_id": 0})
