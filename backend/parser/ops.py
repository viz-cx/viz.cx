"""Special functions for VIZ Blockchain to MongoDB parser"""
import datetime as dt
import os
import pymongo
from viz import Client

node = 'https://node.viz.cx/'
viz = Client(node=node)

db = pymongo.MongoClient(os.getenv('MONGO'))[os.getenv('DB_NAME')]
coll = db[os.getenv('COLLECTION')]

# Получение номера последнего блока в БД
def get_last_blocknum_in_db():
    """Return number of last block from collection in MongoDB database."""
    result = coll.find(
                    {},
                    {'block':1, '_id':0}
    ).sort('block', pymongo.DESCENDING).limit(1)
    return(int(list(result)[0]['block']))

def get_last_block_in_db():
    """Return last block from collection in MongoDB database."""
    result = coll.find({}, {'_id': 0}).sort('block', pymongo.DESCENDING).limit(1)
    return list(result)


# Получение номера последнего блока в БЧ
def get_last_block_in_chain():
    """Return number of last block from the VIZ blockchain."""
    result = (viz.rpc.get_dynamic_global_properties())['head_block_number']
    return(int(result))


def parse_raw_tx_to_mongodb(blocknumber):
    """Request to API node for block and send txs to MongoDB collection."""
    block = viz.rpc.get_ops_in_block(blocknumber, 0)
    for tx in block:
        if tx.get('trx_id') == '0000000000000000000000000000000000000000':
            tx.pop('trx_id')
        tx_t = dt.datetime.fromisoformat(tx.get('timestamp'))
        tx.update({'timestamp': tx_t})
        coll.insert_one(tx)
