"""Helper module for working with MongoDB"""
import datetime as dt
import os
import pymongo


try:
    db = pymongo.MongoClient(os.getenv("MONGO"))[os.getenv("DB_NAME")]
    coll = db[os.getenv("COLLECTION")]
    coll_ops = db[os.getenv("COLLECTION_OPS")]
    coll_custom = coll_ops[os.getenv("COLLECTION_CUSTOM")]
    ops_shares = os.getenv("OPS_SHARES").split('/')
    ops_custom = os.getenv("OPS_CUSTOM")
    count_max_ops_in_block = float(os.getenv("COUNT_MAX_OPS_IN_BLOCK"))

except Exception as e:
    print(str(e))

if '/' in ops_custom:
    ops_custom = ops_custom.split('/')
else:
    ops_custom = [ops_custom]

sorted_op_types = ops_custom + ops_shares

def save_block(block):
    """Save block to MongoDB collection."""
    blocknumber = block[0]["block"]
    for tx in block:
        tx.pop("block")
        if tx.get("trx_id") == "0000000000000000000000000000000000000000":
            tx.pop("trx_id")
        tx_t = dt.datetime.fromisoformat(tx.get("timestamp"))
        tx.update({"timestamp": tx_t})
    coll.insert_one({"block": block, "_id": blocknumber})

def get_last_block_in_db() -> dict:
    """Return last block from collection in MongoDB database."""
    result = coll.find({}).sort(
        "_id", pymongo.DESCENDING).limit(1)
    return tuple(result)[0]


def get_last_blocknum_in_db() -> int:
    """Return number of last block from collection in MongoDB database."""
    result = get_last_block_in_db()
    blocknum = int(result["_id"])
    return blocknum

def get_last_blocknum_and_subcoll() -> dict:
    """Returns collection name and number of last block from subcollections."""
    bnum_max = 0
    subcoll_bnum_max = None
    subcolls = ops_shares + ops_custom
    for coll_op in subcolls:
        result = tuple(coll_ops[coll_op].find({}, {"_id": 1}).sort(
            "_id", pymongo.DESCENDING).limit(1))
        if len(result) != 0:
            bnum_max_in_coll = result[0]['_id']
            if bnum_max_in_coll > bnum_max:
                bnum_max = int(bnum_max_in_coll)
                subcoll_bnum_max = coll_ops[coll_op]
    result = tuple(coll_ops.find({}, {"_id": 1}).sort(
        "_id", pymongo.DESCENDING).limit(1))
    if len(result) != 0:
        bnum_max_in_coll = result[0]['_id']
        if bnum_max_in_coll > bnum_max:
            bnum_max = int(bnum_max_in_coll)
            subcoll_bnum_max = coll_ops
    return {'last block num': bnum_max, 'collection': subcoll_bnum_max}

def sort_block_ops_to_subcolls(block_n_num):
    """Divide block to subcollection by operations. SHARES and CUSTOM ops:
    to separate subcollections. And 'ops' collection for unsorted others."""
    op_number = 0.0
    block_number = block_n_num['_id']
    block = block_n_num['block']
    for op in block:
        op_number += 1/count_max_ops_in_block
        op_type = op['op'][0]
        if op_type in ops_shares:
            shares = (op['op'][1]['shares']).split(' ', 1)
            shares = float(shares[0])
            op['op'][1]['shares'] = shares
        op_new_json = {
            '_id': block_number + op_number,
            'timestamp': op['timestamp'],
            'op': op['op']
            }
        if op_type in ops_shares + ops_custom:
            coll_ops[op_type].insert_one(op_new_json)
        else:
            coll_ops.insert_one(op_new_json)

# Количество всех блоков в БД.
def get_all_blocks_count_in_db() -> int:
    """Return number of all blocks in the database."""
    result = coll.estimated_document_count({})
    return result

# Количество всех блоков в БД в заданном периоде.
def get_all_blocks_count_in_db_in_period(to_date: dt.datetime = dt.datetime.now(),
                                         period: dt.timedelta = dt.timedelta(hours=1)) -> int:
    """Return number of all operations in the database for selected date
        in selected period."""
    result = coll.count_documents({'block.timestamp': {'$gt': (to_date - period),
                                                       '$lt': to_date}})
    return result

# Количество всех транзакций в БД.
def get_all_tx_count_in_db() -> int:
    """Return number of all transactions in database."""
    tx_count = coll_ops.estimated_document_count()
    for op_type in sorted_op_types:
        tx_count += coll_ops[op_type].estimated_document_count()
    return tx_count


def get_tx_number(operation_type) -> int:
    """Return number of selected operation in sorted operations."""
    if operation_type in sorted_op_types:
        result = coll_ops[operation_type].estimated_document_count()
    else:
        result = coll.count_documents({'block.op.0': operation_type})
    return result


def get_tx_number_in_db_in_period(operation_type: str = 'witness_reward',
                                  to_date: dt.datetime = dt.datetime.now(),
                                  period: dt.timedelta = dt.timedelta(hours=1)) -> int:
    """Return number of chosen operations in the database for selected
        date in selected period."""
    result = coll.count_documents({'timestamp': {'$gt': (to_date - period),
                                                 '$lt': to_date},
                                   'block.op.0': operation_type})
    return result


def get_sum_shares_in_period(to_date: dt.datetime = dt.datetime.now(),
                             period: dt.timedelta = dt.timedelta(hours=1)) -> float:
    """Return sum of SHARES for selected date in selected period."""
    result = tuple(coll.find({'timestamp': {'$gt': (to_date - period),
                                            '$lt': to_date}},
                             {'block.op.1.shares': 1, '_id': 0}))
    shares = 0
    for item in result:
        shares += float(item['block']['op'][1]['shares'].split(sep=' ')[0])
    return shares


def get_sum_shares_all() -> float:
    """Return sum of all SHARES."""
    result = list(coll.aggregate([
        {
            "$project": {
                "_id": "$_id",
                "shares": {
                    "$map": {
                        "input": "$block.op",
                        "as": "el",
                        "in": {
                            '$toDouble': {
                                "$first": {
                                    "$split": [
                                        {"$first": "$$el.shares"}, " "]
                                }
                            }
                        }
                    }
                },

            }
        },
        {
            "$group": {
                "_id": "null",
                "sum": {"$sum": {"$first": "$shares"}},
            }
        }
    ]))[0]['sum']
    return result


def get_sum_shares_by_op(operation_type: str = 'witness_reward') -> float:
    """Return sum of SHARES for chosen operation."""
    result = tuple(coll.find({'op': operation_type},
                   {'_id': 0, 'op.shares': 1}))
    shares = 0
    for item in result:
        shares += float(item['op'][0]['shares'].split(sep=' ')[0])
    return shares


def get_sum_shares_by_op_in_period(operation_type: str = 'witness_reward',
                                   to_date: dt.datetime = dt.datetime.now(),
                                   period: dt.timedelta = dt.timedelta(hours=1)) -> float:
    """Return sum of SHARES for chosen operation for selected date in
    selected period."""
    result = tuple(coll.find({'op': operation_type},
                             {'op.shares': 1, '_id': 0}))
    shares = 0
    for item in result:
        shares += float(item['op'][0]['shares'].split(sep=' ')[0])
    return shares
