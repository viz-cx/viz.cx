"""One-off backfill for a contiguous range of missing blocks.

The forward parser only appends past the chain tip — `parser.resolve_start_block`
never rewinds below the last stored block — so a historical hole cannot be
filled by the running worker. This script walks an explicit ``[START, END]``
range and fetches every absent block from the configured VIZ node
(``VIZ_NODES``), writing documents byte-for-byte identical to
``helpers.mongo.save_block`` so backfilled blocks are indistinguishable from
parser-written ones.

Properties
----------
* **Idempotent / resumable** — blocks already present in the collection are
  skipped, so the script can be re-run after any interruption and only fills
  what is still missing.
* **Hole-tolerant** — blocks the node cannot serve (e.g. the snapshot-restore
  hole where ``get_ops_in_block`` returns ``[]``) are logged and left missing;
  a final summary lists the contiguous sub-ranges that remain unfilled.
* **Batched** — inserts in unordered bulk batches for throughput.

The default range is the single missing hole verified 2026-06-14:
``79,105,831 – 80,679,604`` (1,573,774 blocks). Note that the lower part of
this range predates the node's op history and is expected to be unrecoverable
from any snapshot-restored node; a full-history node is required to fill it.

Usage (run from the app root — the container's ``/code``)::

    python -m scripts.backfill_blocks
    BACKFILL_START=80463601 BACKFILL_END=80679604 python -m scripts.backfill_blocks
    BACKFILL_BATCH=2000 BACKFILL_SLEEP=0.05 python -m scripts.backfill_blocks

Environment
-----------
MONGO, DB_NAME, COLLECTION   inherited from the app config (same as the parser).
VIZ_NODES                    the node(s) to fetch from (same as the parser).
BACKFILL_START / BACKFILL_END  inclusive range to fill (defaults to the hole).
BACKFILL_BATCH               blocks per progress/insert flush (default 1000).
BACKFILL_SLEEP               seconds to sleep between block fetches (default 0).
BACKFILL_MAX_RETRIES         retries per block on transient node errors (default 3).
"""

import datetime as dt
import os
import sys
from time import sleep

from pymongo.errors import BulkWriteError

from helpers.mongo import coll
from helpers.viz import get_ops_in_block

# The single missing hole verified 2026-06-14 (see memory: viz-node-situation).
DEFAULT_START = 79_105_831
DEFAULT_END = 80_679_604

ZERO_TRX = "0000000000000000000000000000000000000000"


def _block_to_doc(block: list, expected_num: int) -> dict:
    """Transform a raw get_ops_in_block result into a stored document.

    Mirrors helpers.mongo.save_block exactly: derive the block number from the
    first op, strip the per-op ``block`` field, drop the all-zero virtual
    ``trx_id``, and coerce timestamps to datetime. Raises ValueError if the
    block is empty (nothing to derive a number from) so the caller can treat it
    as unavailable."""
    if not block:
        raise ValueError("empty block")
    blocknumber = block[0]["block"]
    if blocknumber != expected_num:
        print(f"  ! block {expected_num}: node returned number {blocknumber}", flush=True)
    for tx in block:
        tx.pop("block", None)
        if tx.get("trx_id") == ZERO_TRX:
            tx.pop("trx_id")
        ts = tx.get("timestamp")
        if isinstance(ts, str):
            tx["timestamp"] = dt.datetime.fromisoformat(ts)
    return {"_id": blocknumber, "block": block}


def _fetch(num: int, max_retries: int) -> list:
    """Fetch one block's ops, retrying transient node errors with backoff.

    Returns the raw block list (possibly empty if the node has no such block).
    Raises on persistent failure so the caller can record it as an error rather
    than a genuine hole."""
    delay = 1.0
    last_exc: Exception | None = None
    for attempt in range(1, max_retries + 1):
        try:
            return get_ops_in_block(num, False)
        except Exception as exc:  # noqa: BLE001 - node/transport errors are opaque
            last_exc = exc
            if attempt < max_retries:
                sleep(min(delay, 15.0))
                delay *= 2
    raise RuntimeError(f"block {num} failed after {max_retries} attempts: {last_exc}")


def _present_ids(lo: int, hi: int) -> set:
    """Block numbers already stored in the inclusive window [lo, hi]."""
    cursor = coll.find({"_id": {"$gte": lo, "$lte": hi}}, {"_id": 1})
    return {d["_id"] for d in cursor}


def _record_missing(ranges: list, num: int) -> None:
    """Append a block number to the compacted list of contiguous missing runs."""
    if ranges and ranges[-1][1] == num - 1:
        ranges[-1][1] = num
    else:
        ranges.append([num, num])


def _print_summary(start, end, filled, present, unavailable, errors, missing_ranges):
    span = end - start + 1
    print("\n=== backfill summary ===", flush=True)
    print(f"range            : {start:,} – {end:,}  ({span:,} blocks)", flush=True)
    print(f"newly filled     : {filled:,}", flush=True)
    print(f"already present  : {present:,}", flush=True)
    print(f"unavailable      : {unavailable:,}  (node returned empty)", flush=True)
    print(f"fetch errors     : {errors:,}  (persistent node/transport failures)", flush=True)
    if missing_ranges:
        print(f"still missing    : {len(missing_ranges)} range(s):", flush=True)
        for lo, hi in missing_ranges:
            print(f"  {lo:,} – {hi:,}  ({hi - lo + 1:,})", flush=True)
    else:
        print("still missing    : none — range is complete", flush=True)


def main() -> int:
    start = int(os.getenv("BACKFILL_START", str(DEFAULT_START)))
    end = int(os.getenv("BACKFILL_END", str(DEFAULT_END)))
    batch = int(os.getenv("BACKFILL_BATCH", "1000"))
    pause = float(os.getenv("BACKFILL_SLEEP", "0"))
    max_retries = int(os.getenv("BACKFILL_MAX_RETRIES", "3"))
    if start > end:
        print(f"nothing to do: start {start} > end {end}", flush=True)
        return 0

    print(f"Backfilling blocks {start:,} – {end:,} ({end - start + 1:,} blocks), "
          f"batch={batch}, sleep={pause}s", flush=True)

    filled = present = unavailable = errors = 0
    missing_ranges: list = []
    buf: list = []

    def flush() -> None:
        nonlocal filled
        if not buf:
            return
        try:
            res = coll.insert_many(buf, ordered=False)
            filled += len(res.inserted_ids)
        except BulkWriteError as bwe:
            # Duplicate-key (race with the live parser, or a re-run) is benign;
            # count only genuinely new inserts.
            filled += bwe.details.get("nInserted", 0)
        buf.clear()

    try:
        lo = start
        while lo <= end:
            hi = min(lo + batch - 1, end)
            already = _present_ids(lo, hi)
            for num in range(lo, hi + 1):
                if num in already:
                    present += 1
                    continue
                try:
                    raw = _fetch(num, max_retries)
                except RuntimeError as exc:
                    errors += 1
                    _record_missing(missing_ranges, num)
                    print(f"  ! {exc}", flush=True)
                    continue
                try:
                    buf.append(_block_to_doc(raw, num))
                except ValueError:
                    unavailable += 1
                    _record_missing(missing_ranges, num)
                if pause:
                    sleep(pause)
            flush()
            done = hi - start + 1
            print(f"… {hi:,} (filled={filled:,} present={present:,} "
                  f"unavail={unavailable:,} err={errors:,}) "
                  f"{done * 100 // (end - start + 1)}%", flush=True)
            lo = hi + 1
    except KeyboardInterrupt:
        flush()
        print("\ninterrupted — flushing and summarizing progress so far", flush=True)

    _print_summary(start, end, filled, present, unavailable, errors, missing_ranges)
    return 0


if __name__ == "__main__":
    sys.exit(main())
