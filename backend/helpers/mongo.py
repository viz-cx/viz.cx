"""Helper module for working with MongoDB"""
import datetime as dt
import os
import pymongo
import re
from helpers.enums import OpType, ops_custom, ops_shares

db = pymongo.MongoClient(os.getenv("MONGO", ""))[os.getenv("DB_NAME", "")]
coll = db[os.getenv("COLLECTION", "")]
coll_ops = db[os.getenv("COLLECTION_OPS", "")]
coll_custom = coll_ops[OpType.custom]
count_max_ops_in_block = 100_000

sorted_op_types = ops_custom + ops_shares


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
    subcolls = ops_shares + ops_custom
    for coll_op in subcolls:
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


def sort_block_ops_to_subcolls(block_n_num) -> None:
    """Divide block to subcollection by operations. SHARES and CUSTOM ops:
    to separate subcollections. And 'ops' collection for unsorted others."""
    op_number = 0.0
    block_number = block_n_num["_id"]
    block = block_n_num["block"]
    for op in block:
        op_number += 1 / count_max_ops_in_block
        op_type = op["op"][0]
        if op_type in ops_shares:
            shares = (op["op"][1]["shares"]).split(" ", 1)
            shares = float(shares[0])
            op["op"][1]["shares"] = shares
        op_new_json = {
            "_id": block_number + op_number,
            "timestamp": op["timestamp"],
            "op": op["op"],
        }
        if op_type in ops_shares + ops_custom:
            coll_ops[op_type].insert_one(op_new_json)
        else:
            coll_ops.insert_one(op_new_json)


# Количество всех блоков в БД.
def get_all_blocks_count() -> int:
    """Return number of all blocks in the database."""
    result = coll.estimated_document_count({})
    return result


# Количество всех операций в БД в заданном периоде.
def get_ops_count_in_period(
    to_date: dt.datetime = dt.datetime.now(),
    from_date: dt.datetime = dt.datetime.now() - dt.timedelta(hours=1),
) -> int:
    """Return number of all operations in the database for selected date
    in selected period."""
    ops_count = coll_ops.count_documents(
        {"timestamp": {"$gt": from_date, "$lt": to_date}}
    )
    for op in sorted_op_types:
        ops_count += coll_ops[op].count_documents(
            {"timestamp": {"$gt": from_date, "$lt": to_date}}
        )
    return ops_count


# Количество всех операций в БД.
def get_ops_count() -> int:
    """Return number of all transactions in database."""
    ops_count = coll_ops.estimated_document_count()
    for op_type in sorted_op_types:
        ops_count += coll_ops[op_type].estimated_document_count()
    return ops_count


def get_ops_count_by_type(operation_type) -> int:
    """Return number of selected operation in database."""
    if operation_type in sorted_op_types:
        result = coll_ops[operation_type].estimated_document_count()
    else:
        result = coll_ops.count_documents({"op.0": operation_type})
    return result


def get_ops_count_by_type_in_period(
    operation_type: OpType = OpType.witness_reward,
    to_date: dt.datetime = dt.datetime.now(),
    from_date: dt.datetime = dt.datetime.now() - dt.timedelta(hours=1),
) -> int:
    """Return number of chosen operations in the database for selected
    date in selected period."""
    if operation_type in sorted_op_types:
        result = coll_ops[operation_type].count_documents(
            {"timestamp": {"$gt": from_date, "$lt": to_date}}
        )
    else:
        result = coll_ops.count_documents(
            {
                "timestamp": {"$gt": from_date, "$lt": to_date},
                "op.0": operation_type,
            }
        )
    return result


def get_sum_shares_in_period(
    to_date: dt.datetime = dt.datetime.now(),
    from_date: dt.datetime = dt.datetime.now() - dt.timedelta(hours=1),
) -> float:
    """Return sum of SHARES for selected date in selected period."""
    sum_shares = 0
    for op_type in ops_shares:
        result = coll_ops[op_type].aggregate(
            [
                {"$match": {"timestamp": {"$gt": from_date, "$lt": to_date}}},
                {
                    "$group": {
                        "_id": None,
                        "shares": {"$sum": {"$sum": "$op.shares"}},
                    }
                },
            ]
        )
        try:
            sum_shares += tuple(result)[0]["shares"]
        except IndexError:
            continue
    return sum_shares


def get_sum_shares_all() -> float:
    """Return sum of all SHARES."""
    sum_shares = 0
    for op_type in ops_shares:
        result = coll_ops[op_type].aggregate(
            [
                {
                    "$group": {
                        "_id": None,
                        "shares": {"$sum": {"$sum": "$op.shares"}},
                    }
                }
            ]
        )
        try:
            sum_shares += tuple(result)[0]["shares"]
        except IndexError:
            continue
    return sum_shares


def get_sum_shares_by_op(
    operation_type: OpType = OpType.witness_reward,
) -> float:
    """Return sum of SHARES for chosen operation."""
    if operation_type in sorted_op_types:
        result = coll_ops[operation_type].aggregate(
            [
                {
                    "$group": {
                        "_id": None,
                        "shares": {"$sum": {"$sum": "$op.shares"}},
                    }
                }
            ]
        )
        try:
            sum_shares = tuple(result)[0]["shares"]
        except IndexError:
            sum_shares = 0
    else:
        result = coll_ops.aggregate(
            [
                {"$match": {"op.0": operation_type}},
                {
                    "$group": {
                        "_id": None,
                        "shares": {"$sum": {"$sum": "$op.shares"}},
                    }
                },
            ]
        )
        try:
            sum_shares = tuple(result)[0]["shares"]
        except IndexError:
            sum_shares = 0
    return sum_shares


def get_sum_shares_by_op_in_period(
    operation_type: OpType = OpType.witness_reward,
    to_date: dt.datetime = dt.datetime.now(),
    from_date: dt.datetime = dt.datetime.now() - dt.timedelta(hours=1),
) -> float:
    """Return sum of SHARES for chosen operation for selected date in
    selected period."""
    if operation_type in sorted_op_types:
        result = coll_ops[operation_type].aggregate(
            [
                {"$match": {"timestamp": {"$gt": from_date, "$lt": to_date}}},
                {
                    "$group": {
                        "_id": None,
                        "shares": {"$sum": {"$sum": "$op.shares"}},
                    }
                },
            ]
        )
        try:
            sum_shares = tuple(result)[0]["shares"]
        except IndexError:
            sum_shares = 0
    else:
        result = coll_ops.aggregate(
            [
                {
                    "$match": {
                        "timestamp": {"$gt": from_date, "$lt": to_date},
                        "$op.0": operation_type,
                    }
                },
                {
                    "$group": {
                        "_id": None,
                        "shares": {"$sum": {"$sum": "$op.shares"}},
                    }
                },
            ]
        )
        try:
            sum_shares = tuple(result)[0]["shares"]
        except IndexError:
            sum_shares = 0
    return sum_shares


def get_top_tg_posts_by_shares_in_period(
    to_date: dt.datetime,
    from_date: dt.datetime,
    in_top: int,
    to_skip: int,
) -> list:
    """Return top Telegram posts by shares."""
    data = list(
        coll_ops[OpType.receive_award].aggregate(
            [
                {
                    "$match": {
                        "timestamp": {"$gt": from_date, "$lt": to_date},
                        "op.memo": {"$regex": "^channel:@"},
                    }
                },
                {
                    "$group": {
                        "_id": "$op.memo",
                        "shares": {"$sum": {"$sum": "$op.shares"}},
                    }
                },
                {"$sort": {"shares": -1}},
                {"$skip": to_skip},
                {"$limit": in_top},
            ]
        )
    )
    result = list()
    for item in data:
        link_to_post = item["_id"][0].replace(":", "/", 2)
        link_to_post = link_to_post.replace("channel/@", "https://t.me/", 1)
        result.append({"post": link_to_post, "value": item["shares"]})
    return result


def get_top_tg_ch_by_shares_in_period(
    to_date: dt.datetime = dt.datetime.now(),
    from_date: dt.datetime = dt.datetime.now() - dt.timedelta(weeks=1),
    in_top: int = 5,
    to_skip: int = 0,
) -> list:
    """Return top Telegram channels by received SHARES."""
    data = coll_ops[OpType.receive_award].aggregate(
        [
            {
                "$match": {
                    "timestamp": {"$gt": from_date, "$lt": to_date},
                    "op.memo": {"$regex": "^channel:@"},
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "channel": {
                        "$arrayElemAt": [
                            {
                                "$split": [
                                    {"$arrayElemAt": ["$op.memo", 0]},
                                    ":",
                                ]
                            },
                            1,
                        ]
                    },
                    "shares": "$op.shares",
                }
            },
            {
                "$group": {
                    "_id": "$channel",
                    "shares": {"$sum": {"$sum": "$shares"}},
                }
            },
            {"$sort": {"shares": -1}},
            {"$skip": to_skip},
            {"$limit": in_top},
        ]
    )
    result = list()
    for item in data:
        link_to_channel = item["_id"].replace("@", "https://t.me/", 1)
        result.append({"channel": link_to_channel, "value": item["shares"]})
    return result


def get_top_tg_posts_by_awards_count_in_period(
    to_date: dt.datetime = dt.datetime.now(),
    from_date: dt.datetime = dt.datetime.now() - dt.timedelta(weeks=1),
    in_top: int = 5,
    to_skip: int = 0,
) -> list:
    """Return top Telegram posts by awards count."""
    data = list(
        coll_ops[OpType.receive_award].aggregate(
            [
                {
                    "$match": {
                        "timestamp": {"$gt": from_date, "$lt": to_date},
                        "op.memo": {"$regex": "^channel:@"},
                    }
                },
                {
                    "$group": {
                        "_id": "$op.memo",
                        "awards": {"$sum": {"$sum": 1}},
                    }
                },
                {"$sort": {"awards": -1}},
                {"$skip": to_skip},
                {"$limit": in_top},
            ]
        )
    )
    result = list()
    for item in data:
        link_to_post = item["_id"][0].replace(":", "/", 2)
        link_to_post = link_to_post.replace("channel/@", "https://t.me/", 1)
        result.append({"post": link_to_post, "value": item["awards"]})
    return result


def get_tg_ch_post_awards_and_shares_in_period(
    tg_ch_post_link: str = "https://t.me/viz_news/80",
    to_date: dt.datetime = dt.datetime.now(),
    from_date: dt.datetime = dt.datetime.now() - dt.timedelta(weeks=1),
) -> dict:
    """Return telegram channel post awards count and received SHARES in period"""
    memo_post_link = tg_ch_post_link.split("t.me/", 1)[-1]
    memo_post_link = "channel:@" + memo_post_link.replace("/", ":")
    result = coll_ops[OpType.receive_award].aggregate(
        [
            {
                "$match": {
                    "timestamp": {"$gt": from_date, "$lt": to_date},
                    "op.memo": memo_post_link,
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "post_link": tg_ch_post_link,
                    "shares": "$op.shares",
                }
            },
            {
                "$group": {
                    "_id": "$post_link",
                    "awards": {"$sum": {"$sum": 1}},
                    "shares": {"$sum": {"$sum": "$shares"}},
                }
            },
        ]
    )
    result = tuple(result)
    if len(result) != 0:
        result = result[0]
        result["post_link"] = result.pop("_id")
    else:
        result = {"awards": 0, "shares": 0, "post_link": tg_ch_post_link}
    return result


def get_top_tg_chs_by_awards_count_in_period(
    to_date: dt.datetime = dt.datetime.now(),
    from_date: dt.datetime = dt.datetime.now() - dt.timedelta(weeks=1),
    in_top: int = 5,
    to_skip: int = 0,
) -> list:
    """Return top telegram channels by awards count."""
    data = coll_ops[OpType.receive_award].aggregate(
        [
            {
                "$match": {
                    "timestamp": {"$gt": from_date, "$lt": to_date},
                    "op.memo": {"$regex": "^channel:@"},
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "channel": {
                        "$arrayElemAt": [
                            {
                                "$split": [
                                    {"$arrayElemAt": ["$op.memo", 0]},
                                    ":",
                                ]
                            },
                            1,
                        ]
                    },
                    "shares": "$op.shares",
                }
            },
            {"$group": {"_id": "$channel", "awards": {"$sum": {"$sum": 1}}}},
            {"$sort": {"awards": -1}},
            {"$skip": to_skip},
            {"$limit": in_top},
        ]
    )
    result = list()
    for item in data:
        link_to_channel = item["_id"].replace("@", "https://t.me/", 1)
        result.append({"channel": link_to_channel, "value": item["awards"]})
    return result


def get_tg_ch_awards_and_shares_in_period(
    tg_ch_id: str = "@viz_news",
    to_date: dt.datetime = dt.datetime.now(),
    from_date: dt.datetime = dt.datetime.now() - dt.timedelta(weeks=1),
) -> dict:
    """Return SHARES and awards received by telegram channel."""
    result = coll_ops[OpType.receive_award].aggregate(
        [
            {
                "$match": {
                    "timestamp": {"$gt": from_date, "$lt": to_date},
                    "op.memo": {"$regex": "^" + "channel:" + tg_ch_id},
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "channel": tg_ch_id,
                    "shares": "$op.shares",
                }
            },
            {
                "$group": {
                    "_id": "$channel",
                    "awards": {"$sum": {"$sum": 1}},
                    "shares": {"$sum": {"$sum": "$shares"}},
                }
            },
        ]
    )
    result = tuple(result)
    if len(result) != 0:
        result = result[0]
        result["channel"] = result.pop("_id")
    else:
        result = {"awards": 0, "shares": 0, "channel": tg_ch_id}
    return result


def get_top_readdleme_posts_by_shares_in_period(
    to_date: dt.datetime,
    from_date: dt.datetime,
    in_top: int,
    to_skip: int,
) -> list:
    """Return top Readdle.Me posts by SHARES."""
    data = list(
        coll_ops[OpType.receive_award].aggregate(
            [
                {
                    "$match": {
                        "timestamp": {"$gt": from_date, "$lt": to_date},
                        "op.memo": {"$regex": "^viz://@"},
                    }
                },
                {
                    "$group": {
                        "_id": "$op.memo",
                        "shares": {"$sum": {"$sum": "$op.shares"}},
                    }
                },
                {"$sort": {"shares": -1}},
                {"$skip": to_skip},
                {"$limit": in_top},
            ]
        )
    )
    result = list()
    for item in data:
        link_to_post = item["_id"][0]
        result.append({"post": link_to_post, "value": item["shares"]})
    return result


def get_readdleme_post_awards_and_shares_in_period(
    link_to_post: str,
    to_date: dt.datetime,
    from_date: dt.datetime,
) -> dict:
    """Return Voice post awards count and received SHARES in period"""
    memo_post_link = "viz://" + link_to_post.split("viz://", 1)[-1]
    regex = "^" + re.escape(memo_post_link) + "($|\\/)"
    result = coll_ops[OpType.receive_award].aggregate(
        [
            {
                "$match": {
                    "timestamp": {"$gt": from_date, "$lt": to_date},
                    "op.memo": {"$regex": regex},
                }
            },
            {
                "$group": {
                    "_id": "$op.memo",
                    "awards": {"$sum": {"$sum": 1}},
                    "shares": {"$sum": {"$sum": "$op.shares"}},
                }
            },
        ]
    )
    result = tuple(result)
    if len(result) != 0:
        result = result[0]
        result["post_link"] = result.pop("_id")[0]
    else:
        result = {"awards": 0, "shares": 0, "post_link": memo_post_link}
    return result


def get_top_readdleme_authors_by_shares_in_period(
    to_date: dt.datetime,
    from_date: dt.datetime,
    in_top: int,
    to_skip: int,
) -> list:
    """Return top Readdle.Me authors by SHARES."""
    data = list(
        coll_ops[OpType.receive_award].aggregate(
            [
                {
                    "$match": {
                        "timestamp": {"$gt": from_date, "$lt": to_date},
                        "op.memo": {"$regex": "^viz://@"},
                    }
                },
                {
                    "$project": {
                        "_id": 0,
                        "author": {
                            "$arrayElemAt": [
                                {
                                    "$split": [
                                        {"$arrayElemAt": ["$op.memo", 0]},
                                        "/",
                                    ]
                                },
                                2,
                            ]
                        },
                        "shares": "$op.shares",
                    }
                },
                {
                    "$group": {
                        "_id": "$author",
                        "shares": {"$sum": {"$sum": "$shares"}},
                    }
                },
                {"$sort": {"shares": -1}},
                {"$skip": to_skip},
                {"$limit": in_top},
            ]
        )
    )
    result = list()
    for item in data:
        result.append({"account": item["_id"], "value": item["shares"]})
    return result


def get_top_readdleme_posts_by_awards_in_period(
    to_date: dt.datetime,
    from_date: dt.datetime,
    in_top: int,
    to_skip: int,
) -> list:
    """Return top Readdle.Me posts by awards count."""
    data = list(
        coll_ops[OpType.receive_award].aggregate(
            [
                {
                    "$match": {
                        "timestamp": {"$gt": from_date, "$lt": to_date},
                        "op.memo": {"$regex": "^viz://@"},
                    }
                },
                {
                    "$group": {
                        "_id": "$op.memo",
                        "awards": {"$sum": {"$sum": 1}},
                    }
                },
                {"$sort": {"awards": -1}},
                {"$skip": to_skip},
                {"$limit": in_top},
            ]
        )
    )
    result = list()
    for item in data:
        link_to_post = item["_id"][0]
        result.append({"post": link_to_post, "value": item["awards"]})
    return result


def get_top_readdleme_authors_by_awards_in_period(
    to_date: dt.datetime,
    from_date: dt.datetime,
    in_top: int,
    to_skip: int,
) -> list:
    """Return top Readdle.Me authors by awards count."""
    data = list(
        coll_ops[OpType.receive_award].aggregate(
            [
                {
                    "$match": {
                        "timestamp": {"$gt": from_date, "$lt": to_date},
                        "op.memo": {"$regex": "^viz://@"},
                    }
                },
                {
                    "$project": {
                        "_id": 0,
                        "author": {
                            "$arrayElemAt": [
                                {
                                    "$split": [
                                        {"$arrayElemAt": ["$op.memo", 0]},
                                        "/",
                                    ]
                                },
                                2,
                            ]
                        },
                    }
                },
                {
                    "$group": {
                        "_id": "$author",
                        "awards": {"$sum": {"$sum": 1}},
                    }
                },
                {"$sort": {"awards": -1}},
                {"$skip": to_skip},
                {"$limit": in_top},
            ]
        )
    )
    result = list()
    for item in data:
        result.append({"account": item["_id"], "value": item["awards"]})
    return result


def get_readdleme_author_awards_and_shares_in_period(
    readdleme_author_id: str = "@inov8",
    to_date: dt.datetime = dt.datetime.now(),
    from_date: dt.datetime = dt.datetime.now() - dt.timedelta(weeks=1),
) -> dict:
    """Return Readdle.Me author awards count and received SHARES in period."""
    result = coll_ops[OpType.receive_award].aggregate(
        [
            {
                "$match": {
                    "timestamp": {"$gt": from_date, "$lt": to_date},
                    "op.memo": {"$regex": "^viz://" + readdleme_author_id},
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "account": readdleme_author_id,
                    "shares": "$op.shares",
                }
            },
            {
                "$group": {
                    "_id": "$account",
                    "awards": {"$sum": {"$sum": 1}},
                    "shares": {"$sum": {"$sum": "$shares"}},
                }
            },
        ]
    )
    result = tuple(result)
    if len(result) != 0:
        result = result[0]
        result["account"] = result.pop("_id")
    else:
        result = {"account": readdleme_author_id, "awards": 0, "shares": 0}
    return result
