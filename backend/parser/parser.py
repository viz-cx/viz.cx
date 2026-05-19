"""VIZ Blockchain to MongoDB parser"""

from time import sleep
from typing import NoReturn

from helpers.mongo import get_last_blocknum, save_block
from helpers.viz import get_last_block_in_chain, get_ops_in_block


def start_parsing() -> NoReturn:
    """Parse VIZ Blockchain blocks to MongoDB."""
    try:
        last_db_block = get_last_blocknum()
        print(f"Last block in db: {last_db_block}")
    except IndexError:
        print("Blocks not found in current MongoDB collection. Start from 1.")
        last_db_block = 0
    while True:
        try:
            last_chain_block = get_last_block_in_chain()
            if last_chain_block - last_db_block > 0:
                for _ in range(last_db_block + 1, last_chain_block + 1):
                    block = get_ops_in_block(_, False)
                    save_block(block)
                    last_db_block = _
                    if last_db_block % 100 == 0:
                        print(f"Saved block {_} (ch: {last_chain_block})")
            else:
                sleep(3)
        except Exception as e:
            print(f"Parsing error: {str(e)}. Restart in 10 seconds.")
            sleep(10)
            print("Restarting...")
