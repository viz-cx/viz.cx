import datetime, os
from fastapi import FastAPI
from pymongo import MongoClient
from viz import Client as VIZ
from dotenv import load_dotenv

load_dotenv(dotenv_path='.env')

client = MongoClient(os.getenv('MONGO'))
db = client["viz-blockchain"]
coll = db.blocks
app = FastAPI()
node = 'wss://node.viz.cx/ws'
viz = VIZ(node=node)

currentBlock: int = 0

def parser():
    global currentBlock
    if currentBlock == 0:
        currentBlock = getLastSavedBlock() + 1
    dgp = viz.info()
    lastIrreversibleBlock = dgp['last_irreversible_block_num']
    while lastIrreversibleBlock > currentBlock:
        processNextBlock()
        currentBlock += 1

def processNextBlock():
    global currentBlock
    print(viz.rpc.get_ops_in_block(currentBlock, 0))


def getLastSavedBlock() -> int:
    return 0

# parser()


@app.get('/')
def home():
    return({'key':'Hello'})

@app.get('/dgp')
def info():
    return viz.get_dynamic_global_properties()

@app.get('/block/{block}')
def info(block):
    return viz.rpc.get_ops_in_block(block, 0)