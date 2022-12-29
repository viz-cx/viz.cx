import os
from env import *
from threading import Thread
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from parser.parser import start_parsing
from sorter.sorter import start_sorting
from helpers.router import router

parsing_thread = Thread(target=start_parsing, daemon=True, name="parser")
parsing_thread.start()

sorting_thread = Thread(target=start_sorting, daemon=True, name="sorter")
sorting_thread.start()

app = FastAPI(root_path=os.getenv("ROOT_PATH", "/"))

origins = ["https://viz.cx", "http://localhost:8000", "http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
