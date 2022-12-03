from threading import Thread
from fastapi import FastAPI
from viz import Client as VIZ
from dotenv import load_dotenv
load_dotenv(dotenv_path='.env')
from multiprocessing import Process
from parser.parser import start_parsing
from parser.ops import *

app = FastAPI()
node = 'wss://node.viz.cx/ws'
viz = VIZ(node=node)

thread = Thread(target=start_parsing, daemon=True, name='parser')
thread.start()

@app.get('/')
def home():
    return viz.rpc.get_dynamic_global_properties()

@app.get('/latest')
def latest():
    return get_last_block_in_db()
