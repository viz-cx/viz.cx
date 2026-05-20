import logging
import os
from contextlib import asynccontextmanager
from threading import Thread

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend

load_dotenv()

from helpers.db_client import ensure_indexes  # noqa: E402
from helpers.router import router  # noqa: E402
from helpers.viz import init_node  # noqa: E402
from parser.parser import start_parsing  # noqa: E402
from parser.posts import start_posts_parsing  # noqa: E402
from sorter.sorter import start_sorting  # noqa: E402

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def _start_background_workers() -> None:
    """Spawn parser/sorter/posts threads. Skipped in tests via SKIP_WORKERS=1."""
    if os.getenv("SKIP_WORKERS") == "1":
        return
    Thread(target=start_parsing, daemon=True, name="parser").start()
    Thread(target=start_sorting, daemon=True, name="sorter").start()
    Thread(target=start_posts_parsing, daemon=True, name="posts").start()


@asynccontextmanager
async def lifespan(app: FastAPI):
    FastAPICache.init(InMemoryBackend(), prefix="fastapi-cache")
    if os.getenv("SKIP_WORKERS") != "1":
        init_node()
        ensure_indexes()
    _start_background_workers()
    yield


app = FastAPI(
    title="VIZ.cx API", root_path=os.getenv("ROOT_PATH", "/"), lifespan=lifespan
)
app.include_router(router)

_playground_dir = os.path.join(os.path.dirname(__file__), "static", "playground")
if os.path.isdir(_playground_dir):
    app.mount(
        "/playground",
        StaticFiles(directory=_playground_dir, html=True),
        name="playground",
    )

origins = ["https://viz.cx", "http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
