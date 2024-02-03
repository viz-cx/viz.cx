"""VIZ Blockchain MongoDB operations sorter."""

from typing import NoReturn
import pymongo
import os
from env import *
from helpers.mongo import (
    get_last_blocknum_and_subcoll,
    get_last_blocknum,
    sort_block_ops_to_subcolls,
)
from time import sleep
from helpers.enums import OpType, ops_custom, ops_shares

db = pymongo.MongoClient(os.getenv("MONGO", ""))[os.getenv("DB_NAME", "")]
coll = db[os.getenv("COLLECTION", "")]
coll_ops = db[os.getenv("COLLECTION_OPS", "")]
coll_custom = coll_ops[OpType.custom]


def del_last_sorted_ops(blocknum) -> None:
    """Delete the last sorted ops in the block.
    Args:
        blocknum (int): block number"""
    coll_ops.delete_many({"_id": {"$gte": blocknum}})
    for op in ops_shares + ops_custom:
        coll_ops[op].delete_many({"_id": {"$gte": blocknum}})


def start_sorting() -> NoReturn:
    """Sort VIZ blockchain MongoDB blocks to subcolls by operation type."""
    last_sorted_block = get_last_blocknum_and_subcoll()["last_block_num"]
    if last_sorted_block != 0:
        del_last_sorted_ops(last_sorted_block)
        print("Sorted ops from block {} deleted.".format(last_sorted_block))
        last_sorted_block -= 1
    else:
        print("Blocks not found in subcolls.")
        last_sorted_block = 0
    while True:
        try:
            last_db_block = get_last_blocknum()
            if last_db_block - last_sorted_block > 0:
                for blocknum in range(last_sorted_block + 1, last_db_block + 1):
                    block = coll.find_one({"_id": blocknum})
                    sort_block_ops_to_subcolls(block)
                    if blocknum % 100 == 0:
                        print(
                            "Sorted block {} (db: {})".format(blocknum, last_db_block)
                        )
                    last_sorted_block = blocknum
            else:
                sleep(3)
        except Exception as e:
            print("Sorting error: {}. Restart in 10 seconds.".format(str(e)))
            sleep(10)
            print("Restarting...")
