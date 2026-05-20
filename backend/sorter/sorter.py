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
    sort_blocks_to_subcolls,
)

logger = logging.getLogger(__name__)

SORTER_BATCH_SIZE = int(os.getenv("SORTER_BATCH_SIZE", "200"))
SORTER_BATCH_BLOCKS = int(os.getenv("SORTER_BATCH_BLOCKS", "25"))


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
    range query, then flushes them through sort_blocks_to_subcolls in
    chunks of SORTER_BATCH_BLOCKS (default 25). Bulk flushing collapses
    per-op-type insert_many calls and rollup updates across the whole
    chunk."""
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
            pending: list[dict] = []
            prev_logged_century = last_sorted_block // 100
            for block in cursor:
                pending.append(block)
                if len(pending) >= SORTER_BATCH_BLOCKS:
                    sort_blocks_to_subcolls(pending)
                    last_sorted_block = pending[-1]["_id"]
                    pending = []
                    century = last_sorted_block // 100
                    if century != prev_logged_century:
                        logger.info(
                            "Sorted block %d (db: %d)",
                            last_sorted_block, last_db_block,
                        )
                        prev_logged_century = century
            if pending:
                sort_blocks_to_subcolls(pending)
                last_sorted_block = pending[-1]["_id"]
                century = last_sorted_block // 100
                if century != prev_logged_century:
                    logger.info(
                        "Sorted block %d (db: %d)",
                        last_sorted_block, last_db_block,
                    )
        except Exception as e:
            logger.warning("Sorting error: %s. Restart in 10 seconds.", e)
            sleep(10)
            logger.info("Restarting...")
