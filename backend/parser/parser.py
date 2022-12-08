"""VIZ Blockchain to MongoDB parser"""
from helpers.mongo import get_last_blocknum_in_db, save_transaction, save_block
from helpers.viz import get_last_block_in_chain, get_ops_in_block
from time import sleep

def start_parsing():
    try:
        last_blocknum_in_bd = get_last_blocknum_in_db()
        print("Last block in db: {}".format(last_blocknum_in_bd))
    except IndexError:
        print('Blocks not found in current MongoDB collection. Start from 1.')
        last_blocknum_in_bd = 0

    while True:
        try:
            last_blocknum_in_bkchn = get_last_block_in_chain()
            if last_blocknum_in_bkchn - last_blocknum_in_bd > 1:
                for block in range(last_blocknum_in_bd + 1, last_blocknum_in_bkchn):
                    ops = get_ops_in_block(block, False)
                    for tx in ops:
                        save_transaction(tx)
                    last_blocknum_in_bd = block
                    if block % 100 == 0:
                        print("Saved block {}".format(last_blocknum_in_bd))
            else:
                print('Last block was catch up. Parsing will continue in 15 seconds')
                sleep(15)
        except Exception as e:
            print('Error: {}. Restart in 10 seconds.'.format(str(e)))
            sleep(10)
            print('Restarting...')

def start_parsing_by_block():
    try:
        last_blocknum_in_bd = get_last_blocknum_in_db()
        print("Last block in db: {}".format(last_blocknum_in_bd))
    except IndexError:
        print('Blocks not found in current MongoDB collection. Start from 1.')
        last_blocknum_in_bd = 0
    while True:
        try:
            last_blocknum_in_bkchn = get_last_block_in_chain()
            if last_blocknum_in_bkchn - last_blocknum_in_bd > 1:
                for _ in range(last_blocknum_in_bd + 1, last_blocknum_in_bkchn):
                    save_block(get_ops_in_block(_, False))
                    last_blocknum_in_bd = _
                    if last_blocknum_in_bd % 100 == 0:
                        print("Saved block {}".format(last_blocknum_in_bd))
            else:
                print('Last block was catch up. Parsing will continue in 15 seconds')
                sleep(15)
        except Exception as e:
            print('Error: {}. Restart in 10 seconds.'.format(str(e)))
            sleep(10)
            print('Restarting...')            
