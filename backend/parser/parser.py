"""VIZ Blockchain to MongoDB parser"""
from parser.ops import *
from time import sleep

def start_parsing():
    # Getting last blocknumber from MongoDB
    try:
        last_blocknum_in_bd = get_last_blocknum_in_db()
        print("Last block in db: {}".format(last_blocknum_in_bd))
    except IndexError:
        print('Blocks not found in current MongoDB collection. Start from 1.')
        last_blocknum_in_bd = 0

    while True:
        try:
            last_blocknum_in_bkchn = get_last_block_in_chain()
            i = 0
            if last_blocknum_in_bkchn - last_blocknum_in_bd > 1:
                for block in range(last_blocknum_in_bd + 1, last_blocknum_in_bkchn):
                    parse_raw_tx_to_mongodb(block)
                    print("Saved block {}".format(block))
                    sleep(0.1)
            else:
                while i < 60:
                    last_blocknum_in_bd += 1
                    parse_raw_tx_to_mongodb(last_blocknum_in_bd, coll)
                    i += 1
                    sleep(3)
        except:
            print('Error. Waiting for 10 seconds.')
            sleep(10)
            print('Restarting...')
