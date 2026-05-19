"""VIZ Blockchain MongoDB operations sorter."""

from time import sleep
from typing import NoReturn

from helpers.enums import ops_custom, ops_shares
from helpers.mongo import (
    coll,
    coll_ops,
    get_last_blocknum,
    get_last_blocknum_and_subcoll,
    sort_block_ops_to_subcolls,
)


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
        print(f"Sorted ops from block {last_sorted_block} deleted.")
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
                            f"Sorted block {blocknum} (db: {last_db_block})"
                        )
                    last_sorted_block = blocknum
            else:
                sleep(3)
        except Exception as e:
            print(f"Sorting error: {str(e)}. Restart in 10 seconds.")
            sleep(10)
            print("Restarting...")
