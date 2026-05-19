"""VIZ Blockchain MongoDB operations sorter."""

import logging
import os
from time import sleep
from typing import NoReturn

import pymongo

from helpers.enums import ops_custom, ops_shares
from helpers.mongo import (
    coll,
    coll_ops,
    get_last_blocknum,
    get_last_blocknum_and_subcoll,
    sort_block_ops_to_subcolls,
)

logger = logging.getLogger(__name__)

SORTER_BATCH_SIZE = int(os.getenv("SORTER_BATCH_SIZE", "200"))


def del_last_sorted_ops(blocknum) -> None:
    """Delete the last sorted ops in the block.
    Args:
        blocknum (int): block number"""
    coll_ops.delete_many({"_id": {"$gte": blocknum}})
    for op in ops_shares + ops_custom:
        coll_ops[op].delete_many({"_id": {"$gte": blocknum}})


def start_sorting() -> NoReturn:
    """Sort VIZ blockchain MongoDB blocks to subcolls by operation type.

    Reads up to SORTER_BATCH_SIZE blocks per pass with a single $gt/$lte
    range query, instead of one find_one per block."""
    last_sorted_block = get_last_blocknum_and_subcoll()["last_block_num"]
    if last_sorted_block != 0:
        del_last_sorted_ops(last_sorted_block)
        logger.info("Sorted ops from block %d deleted.", last_sorted_block)
        last_sorted_block -= 1
    else:
        logger.info("Blocks not found in subcolls.")
        last_sorted_block = 0
    while True:
        try:
            last_db_block = get_last_blocknum()
            if last_db_block <= last_sorted_block:
                sleep(3)
                continue
            upper = min(last_sorted_block + SORTER_BATCH_SIZE, last_db_block)
            cursor = coll.find(
                {"_id": {"$gt": last_sorted_block, "$lte": upper}}
            ).sort("_id", pymongo.ASCENDING)
            for block in cursor:
                sort_block_ops_to_subcolls(block)
                last_sorted_block = block["_id"]
                if last_sorted_block % 100 == 0:
                    logger.info(
                        "Sorted block %d (db: %d)", last_sorted_block, last_db_block
                    )
        except Exception as e:
            logger.warning("Sorting error: %s. Restart in 10 seconds.", e)
            sleep(10)
            logger.info("Restarting...")
