"""Backfill the hourly rollups collection from historical blocks.

The sorter writes rollup deltas as new blocks arrive. For blocks that already
sit in `coll` (or in `coll_ops`/`coll_ops/*` subcollections) before rollups
existed, run this once.

Usage:
    python -m scripts.backfill_rollups --batch 1000
    python -m scripts.backfill_rollups --from-block 30000000 --to-block 31000000
    python -m scripts.backfill_rollups --reset  # drop coll_rollups first
"""
from __future__ import annotations

import argparse
import logging
import os
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv

load_dotenv()

from helpers import mongo, rollups  # noqa: E402
from helpers.db_client import ensure_indexes, get_db  # noqa: E402

logger = logging.getLogger("backfill_rollups")


def backfill(from_block: int | None, to_block: int | None, batch: int) -> None:
    ensure_indexes()
    if to_block is None:
        to_block = mongo.get_last_blocknum()
    if from_block is None:
        from_block = 0
    if from_block > to_block:
        logger.info("Nothing to do: from=%d > to=%d", from_block, to_block)
        return

    logger.info("Backfilling rollups for blocks [%d, %d]", from_block, to_block)
    started = time.monotonic()
    processed = 0
    op_count = 0
    for cursor_start in range(from_block, to_block + 1, batch):
        cursor_end = min(cursor_start + batch - 1, to_block)
        blocks = list(
            mongo.coll.find({"_id": {"$gte": cursor_start, "$lte": cursor_end}})
        )
        ops_in_batch: list[dict] = []
        for block in blocks:
            ops_in_batch.extend(block["block"])
            processed += 1
        rollups.aggregate_ops(ops_in_batch)
        op_count += len(ops_in_batch)
        elapsed = time.monotonic() - started
        rate = processed / elapsed if elapsed else 0
        logger.info(
            "Rolled up %d/%d blocks (%.0f blk/s, %d ops, last=%d)",
            processed,
            to_block - from_block + 1,
            rate,
            op_count,
            cursor_end,
        )

    logger.info(
        "Backfill complete: %d blocks, %d ops in %.1fs",
        processed,
        op_count,
        time.monotonic() - started,
    )


def reset_rollups() -> None:
    name = os.getenv("COLLECTION_ROLLUPS", "rollups")
    get_db()[name].drop()
    logger.info("Dropped rollups collection: %s", name)


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--from-block", type=int, default=None)
    parser.add_argument("--to-block", type=int, default=None)
    parser.add_argument("--batch", type=int, default=1000)
    parser.add_argument("--reset", action="store_true",
                        help="Drop the rollups collection before backfilling.")
    args = parser.parse_args()
    if args.reset:
        reset_rollups()
    backfill(args.from_block, args.to_block, args.batch)


if __name__ == "__main__":
    main()
