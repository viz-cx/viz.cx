"""Helper module for working with MongoDB"""
import datetime as dt
import os
import pymongo

db = pymongo.MongoClient(os.getenv('MONGO'))[os.getenv('DB_NAME')]
coll = db[os.getenv('COLLECTION')]

def save_transaction(tx):
    """Save transaction to MongoDB collection."""
    if tx.get('trx_id') == '0000000000000000000000000000000000000000':
        tx.pop('trx_id')
    tx_t = dt.datetime.fromisoformat(tx.get('timestamp'))
    tx.update({'timestamp': tx_t})
    coll.insert_one(tx)

def save_block(block):
    """Save block to MongoDB collection."""
    blocknumber = block[0]['block']
    for tx in block:
        tx.pop('block')
        if tx.get('trx_id') == '0000000000000000000000000000000000000000':
            tx.pop('trx_id')
        tx_t = dt.datetime.fromisoformat(tx.get('timestamp'))
        tx.update({'timestamp': tx_t})
    coll.insert_one({'block': block, 'block_number': blocknumber})
    
def get_last_block_in_db() -> list:
    """Return last block from collection in MongoDB database."""
    result = coll.find({}, {'_id': 0}).sort('block', pymongo.DESCENDING).limit(1)
    return list(result)

def get_last_blocknum_in_db() -> int:
    """Return number of last block from collection in MongoDB database."""
    result = get_last_block_in_db()
    blocknum = int(result[0]['block'])
    return blocknum