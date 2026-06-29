"""VIZ Blockchain to MongoDB parser"""

import os
from time import sleep
from typing import NoReturn

from helpers.mongo import get_last_blocknum, save_block
from helpers.op_stream import emit_block_ops
from helpers.viz import get_last_block_in_chain, get_ops_in_block

# Only blocks within this many of the chain tip emit to live subscribers, so a
# cold-start catch-up or backfill doesn't replay history to WS/webhook clients.
EMIT_TIP_LAG = int(os.getenv("EMIT_TIP_LAG", "5"))


def resolve_start_block(last_db_block: int) -> int:
    """Floor the parser position at PARSER_START_BLOCK - 1.

    Used to jump over a known hole in history that no reachable node can
    serve (blocks 79,105,831–80,463,600 as of 2026-06-10). Never rewinds
    below blocks already in the database."""
    start = int(os.getenv("PARSER_START_BLOCK", "0"))
    return max(last_db_block, start - 1)


def _at_tip(last_chain_block: int, block_num: int) -> bool:
    """True when block_num is within EMIT_TIP_LAG of the chain tip."""
    return last_chain_block - block_num <= EMIT_TIP_LAG


def start_parsing() -> NoReturn:
    """Parse VIZ Blockchain blocks to MongoDB and emit tip ops live."""
    try:
        last_db_block = get_last_blocknum()
        print(f"Last block in db: {last_db_block}")
    except IndexError:
        print("Blocks not found in current MongoDB collection. Start from 1.")
        last_db_block = 0
    last_db_block = resolve_start_block(last_db_block)
    while True:
        try:
            last_chain_block = get_last_block_in_chain()
            if last_chain_block - last_db_block > 0:
                for _ in range(last_db_block + 1, last_chain_block + 1):
                    # `_` is the authoritative block number. The node returns an
                    # empty list for blocks with no ops (common) and for blocks
                    # outside its short get_ops_in_block window; either way we
                    # store an empty block and advance rather than crash, so the
                    # parser can never re-stick on the same block.
                    block = get_ops_in_block(_, False)
                    save_block(block, _)
                    if block and _at_tip(last_chain_block, _):
                        emit_block_ops(_, block)
                    last_db_block = _
                    if last_db_block % 100 == 0:
                        print(f"Saved block {_} (ch: {last_chain_block})")
            else:
                sleep(3)
        except Exception as e:
            print(f"Parsing error: {str(e)}. Restart in 10 seconds.")
            sleep(10)
            print("Restarting...")
