"""Helper module for API"""
import datetime as dt
# import dateparser
import os
from unittest import result
import pymongo
from dotenv import load_dotenv; load_dotenv()

db = pymongo.MongoClient(os.getenv('MONGO'))[os.getenv('DB_NAME')]
coll = db[os.getenv('COLLECTION')]

def get_all_blocks_count_in_db() -> int:
    """Return number of all blocks in the database."""
    result = coll.estimated_document_count({})
    return result

def get_all_blocks_count_in_db_in_period(to_date:dt.datetime=dt.datetime.now(), 
period:dt.timedelta=dt.timedelta(hours=1)) -> int:
    """Return number of all operations in the database for selected date 
        in selected period."""
    result = coll.count_documents({'block.timestamp':{'$gt':(to_date - period), 
                                                '$lt':to_date}})
    return result

def get_all_tx_count_in_db() -> int:
    """Return number of all transactions in database."""
    result = tuple(coll.aggregate([
        {'$unwind': '$block'},
        {'$group': {'_id': 'all transactions', 'count':{'$sum': 1}}},
        {'$project': {'_id': 0, 'all transactions': '$count'}}
    ]))[0]
    return int(result['all transactions'])

def get_tx_number(operation_type):
    """Return number of selected operation."""
    return(coll.count_documents({'op': operation_type}))

def get_tx_number_in_db_in_period(operation_type:str='witness_reward', 
                                    to_date:dt.datetime=dt.datetime.now(), 
                                    period:dt.timedelta=dt.timedelta(hours=1)) -> int:
    """Return number of chosen operations in the database for selected 
        date in selected period."""
    result = coll.count_documents({'timestamp':{'$gt':(to_date - period), 
                                                '$lt':to_date}, 
                                    'op':operation_type})
    return result

def get_sum_shares_in_period(to_date:dt.datetime=dt.datetime.now(),
    period:dt.timedelta=dt.timedelta(hours=1)) -> float:
    """Return sum of SHARES for selected date in selected period."""
    result = tuple(coll.find({'timestamp':{'$gt':(to_date - period), 
                                            '$lt':to_date}}, 
                            {'op.shares':1, '_id':0}))
    shares = 0
    for item in result:
        shares += float(item['op'][0]['shares'].split(sep=' ')[0])
    return shares

def get_sum_shares_all() ->float:
    """Return sum of all SHARES."""
    result = tuple(coll.find({}, {'op.shares':1, '_id':0}))
    shares = 0
    for item in result:
        try:
            shares += float(item['op'][0]['shares'].split(sep=' ')[0])
        except KeyError:
            continue
    return shares

def get_sum_shares_by_op(operation_type:str='witness_reward') -> float:
    """Return sum of SHARES for chosen operation."""
    result = tuple(coll.find({'op':operation_type}, {'_id':0, 'op.shares':1}))
    shares = 0
    for item in result:
        shares += float(item['op'][0]['shares'].split(sep=' ')[0])
    return shares

def get_sum_shares_by_op_in_period(operation_type:str='witness_reward',
    to_date:dt.datetime=dt.datetime.now(),
    period:dt.timedelta=dt.timedelta(hours=1)) -> float:
    """Return sum of SHARES for chosen operation for selected date in
    selected period."""
    result = tuple(coll.find({'op':operation_type}, {'op.shares':1, '_id':0}))
    shares = 0
    for item in result:
        shares += float(item['op'][0]['shares'].split(sep=' ')[0])
    return shares
