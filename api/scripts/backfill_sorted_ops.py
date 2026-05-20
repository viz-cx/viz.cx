"""Backfill the per-op-type subcollections (coll_ops/*).

The sorter thread incrementally sorts new blocks into coll_ops subcollections.
When the sorter was disabled, those subcollections fell behind the main
`coll` (which holds raw blocks). This script catches them up.

Usage:
    python -m scripts.backfill_sorted_ops --batch 1000
    python -m scripts.backfill_sorted_ops --from-block 30000000 --to-block 31000000
"""
from __future__ import annotations

import argparse
import logging
import sys
import time
from pathlib import Path

# Allow `python scripts/backfill_sorted_ops.py` from anywhere.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv

load_dotenv()

from helpers import mongo  # noqa: E402
from helpers.db_client import ensure_indexes  # noqa: E402

logger = logging.getLogger("backfill")


def backfill(from_block: int | None, to_block: int | None, batch: int) -> None:
    ensure_indexes()
    if from_block is None:
        from_block = mongo.get_last_blocknum_and_subcoll()["last_block_num"] + 1
    if to_block is None:
        to_block = mongo.get_last_blocknum()
    if from_block > to_block:
        logger.info("Nothing to do: from=%d > to=%d", from_block, to_block)
        return

    logger.info("Backfilling sorted ops for blocks [%d, %d]", from_block, to_block)
    started = time.monotonic()
    processed = 0
    for cursor_start in range(from_block, to_block + 1, batch):
        cursor_end = min(cursor_start + batch - 1, to_block)
        blocks = list(
            mongo.coll.find({"_id": {"$gte": cursor_start, "$lte": cursor_end}})
        )
        if blocks:
            mongo.sort_blocks_to_subcolls(blocks)
            processed += len(blocks)
        elapsed = time.monotonic() - started
        rate = processed / elapsed if elapsed else 0
        logger.info(
            "Sorted %d/%d blocks (%.0f blk/s, last=%d)",
            processed,
            to_block - from_block + 1,
            rate,
            cursor_end,
        )

    logger.info("Backfill complete: %d blocks in %.1fs", processed, time.monotonic() - started)


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--from-block", type=int, default=None,
                        help="Inclusive lower bound. Defaults to last sorted block + 1.")
    parser.add_argument("--to-block", type=int, default=None,
                        help="Inclusive upper bound. Defaults to last block in coll.")
    parser.add_argument("--batch", type=int, default=1000,
                        help="How many blocks to load per query (default 1000).")
    args = parser.parse_args()
    backfill(args.from_block, args.to_block, args.batch)


if __name__ == "__main__":
    main()
