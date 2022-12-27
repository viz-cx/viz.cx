"""VIZ Blockchain MongoDB operations sorter."""
import pymongo
import os
from env import *
from helpers.mongo import (
    get_last_blocknum_and_subcoll,
    get_last_blocknum,
    sort_block_ops_to_subcolls,
)
from time import sleep


try:
    db = pymongo.MongoClient(os.getenv("MONGO", ""))[os.getenv("DB_NAME", "")]
    coll = db[os.getenv("COLLECTION", "")]
    coll_ops = db[os.getenv("COLLECTION_OPS", "")]
    coll_custom = coll_ops[os.getenv("COLLECTION_CUSTOM", "")]
    ops_shares = os.getenv("OPS_SHARES", "").split("/")
    ops_custom = os.getenv("OPS_CUSTOM", "")
    count_max_ops_in_block = float(os.getenv("COUNT_MAX_OPS_IN_BLOCK", ""))

except Exception as e:
    ops_shares = []
    ops_custom = ""
    readdleme_prefix = ""
    print(str(e))

if "/" in ops_custom:
    ops_custom = ops_custom.split("/")
else:
    ops_custom = [ops_custom]


def del_last_sorted_ops(blocknum):
    """Delete the last sorted ops in the block.
    Args:
        blocknum (int): block number"""
    coll_ops.delete_many({"_id": {"$gte": blocknum}})
    for op in ops_shares + ops_custom:
        coll_ops[op].delete_many({"_id": {"$gte": blocknum}})


def start_sorting():
    """Sort VIZ blockchain MongoDB blocks to subcolls by operation type."""
    try:
        last_bnum_in_scoll = get_last_blocknum_and_subcoll()["last block num"]
        if last_bnum_in_scoll != 0:
            del_last_sorted_ops(last_bnum_in_scoll)
            print(
                "Sorted ops from block {} deleted.".format(last_bnum_in_scoll)
            )
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
                print(
                    "Sorting error: {}. Restart in 10 seconds.".format(str(e))
                )
                sleep(10)
                print("Restarting...")
    except Exception as e:
        print(str(e))
