import os
from threading import Thread
from fastapi import FastAPI
from dotenv import load_dotenv; load_dotenv()
from helpers.mongo import get_last_block_in_db
from helpers.viz import viz
from parser.parser import start_parsing

thread = Thread(target=start_parsing, daemon=True, name='parser')
thread.start()

app = FastAPI(root_path=os.getenv('ROOT_PATH'))

@app.get('/')
def home():
    return viz.info()

@app.get('/latest')
def latest():
    return get_last_block_in_db()
