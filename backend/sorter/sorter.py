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
from helpers.types import OpType, ops_custom, ops_shares

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
    last_bnum_in_scoll = get_last_blocknum_and_subcoll()["last_block_num"]
    if last_bnum_in_scoll != 0:
        del_last_sorted_ops(last_bnum_in_scoll)
        print("Sorted ops from block {} deleted.".format(last_bnum_in_scoll))
        last_bnum_in_scoll += -1
    else:
        print("Blocks not found in subcolls.")
        last_bnum_in_scoll = 0
    while True:
        try:
            last_blocknum_in_db = get_last_blocknum()
            if last_blocknum_in_db - last_bnum_in_scoll > 1:
                sort_start_blocknum = last_bnum_in_scoll + 1
                print("Sorting start from {}.".format(sort_start_blocknum))
                for blocknum in range(
                    sort_start_blocknum, last_blocknum_in_db + 1
                ):
                    block = coll.find_one({"_id": blocknum})
                    sort_block_ops_to_subcolls(block)
                    if blocknum % 10000 == 0:
                        print("Sorted block {}.".format(blocknum))
                    last_bnum_in_scoll = blocknum
            else:
                print(
                    "Last block from DB was sorted up. Sorting will contnue in 15 seconds."
                )
                sleep(15)

        except Exception as e:
            print("Sorting error: {}. Restart in 10 seconds.".format(str(e)))
            sleep(10)
            print("Restarting...")
