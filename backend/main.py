from threading import Thread
from fastapi import FastAPI
from dotenv import load_dotenv
load_dotenv(dotenv_path='.env')
from parser.parser import start_parsing
from parser.ops import *

thread = Thread(target=start_parsing, daemon=True, name='parser')
thread.start()

app = FastAPI(root_path=os.getenv('ROOT_PATH'))

@app.get('/')
def home():
    return viz.rpc.get_dynamic_global_properties()

@app.get('/latest')
def latest():
    return get_last_block_in_db()
