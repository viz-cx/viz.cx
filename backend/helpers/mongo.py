"""Helper module for working with MongoDB"""
import datetime as dt
import os
import pymongo

try:
    db = pymongo.MongoClient(os.getenv("MONGO"))[os.getenv("DB_NAME")]
    coll = db[os.getenv("COLLECTION")]
except Exception as e:
    print(str(e))


def save_block(block):
    """Save block to MongoDB collection."""
    blocknumber = block[0]["block"]
    for tx in block:
        tx.pop("block")
        if tx.get("trx_id") == "0000000000000000000000000000000000000000":
            tx.pop("trx_id")
        tx_t = dt.datetime.fromisoformat(tx.get("timestamp"))
        tx.update({"timestamp": tx_t})
    coll.insert_one({"block": block, "block_number": blocknumber})


def get_last_block_in_db() -> dict:
    """Return last block from collection in MongoDB database."""
    result = coll.find({}, {"_id": 0}).sort(
        "block_number", pymongo.DESCENDING).limit(1)
    return list(result)[0]


def get_last_blocknum_in_db() -> int:
    """Return number of last block from collection in MongoDB database."""
    result = get_last_block_in_db()
    blocknum = int(result["block_number"])
    return blocknum


# Количество всех операций в БД.
def get_all_blocks_count_in_db() -> int:
    """Return number of all blocks in the database."""
    result = coll.estimated_document_count({})
    return result


def get_all_blocks_count_in_db_in_period(to_date: dt.datetime = dt.datetime.now(),
                                         period: dt.timedelta = dt.timedelta(hours=1)) -> int:
    """Return number of all operations in the database for selected date
        in selected period."""
    result = coll.count_documents({'block.timestamp': {'$gt': (to_date - period),
                                                       '$lt': to_date}})
    return result


def get_all_tx_count_in_db() -> int:
    """Return number of all transactions in database."""
    result = tuple(coll.aggregate([
        {'$unwind': '$block'},
        {'$group': {'_id': 'all_transactions', 'count': {'$sum': 1}}},
        {'$project': {'_id': 0, 'all_transactions': '$count'}}
    ]))[0]
    return int(result['all_transactions'])


def get_tx_number(operation_type):
    """Return number of selected operation."""
    return (coll.count_documents({'block.op.0': operation_type}))


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
