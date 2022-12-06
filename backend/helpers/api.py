"""Helper module for API"""
import datetime as dt
# import dateparser
import os
from unittest import result
import pymongo
from dotenv import load_dotenv; load_dotenv()

db = pymongo.MongoClient(os.getenv('MONGO'))[os.getenv('DB_NAME')]
coll = db[os.getenv('COLLECTION')]

def get_all_tx_number_in_db() -> int:
    """Return number of all operations in the database."""
    result = coll.estimated_document_count({})
    return result

def get_all_tx_number_in_db_in_period(to_date:dt.datetime=dt.datetime.now(), 
period:dt.timedelta=dt.timedelta(hours=1)) -> int:
    """Return number of all operations in the database for selected date 
        in selected period."""
    result = coll.count_documents({'timestamp':{'$gt':(to_date - period), '$lt':to_date}})
    return result

def get_tx_number(operation_type:str='witness_reward'):
    """Return number of selected operation."""
    return(coll.count_documents({'op': operation_type}))

def get_tx_number_in_db_in_period(operation_type:str='witness_reward', 
    to_date:dt.datetime=dt.datetime.now(), 
    period:dt.timedelta=dt.timedelta(hours=1)) -> int:
    """Return number of chosen operations in the database for selected 
        date in selected period."""
    result = coll.count_documents({'timestamp':{'$gt':(to_date - period), '$lt':to_date}, 'op':operation_type})
    return result
