"""In-memory pubsub bridging the sync sorter thread to async WebSocket subscribers.

Multi-worker note: subscribers only receive ops that flow through the sorter on
*their own* worker process. With a Redis-less deploy, this is the accepted
limitation — a single worker process handles the indexer and serves ops for
its connected subscribers. A horizontal scale-out would require a broker.
"""
from __future__ import annotations

import asyncio
import logging
import threading
from collections.abc import Callable
from typing import Any

logger = logging.getLogger(__name__)

_Filter = Callable[[dict[str, Any]], bool]
_Entry = tuple[asyncio.AbstractEventLoop, asyncio.Queue, _Filter]

_subscribers: list[_Entry] = []
_lock = threading.Lock()


def subscribe(filter_fn: _Filter, *, maxsize: int = 1000) -> tuple[asyncio.Queue, Callable[[], None]]:
    """Subscribe from an async context. Returns (queue, unsubscribe_fn)."""
    loop = asyncio.get_running_loop()
    queue: asyncio.Queue = asyncio.Queue(maxsize=maxsize)
    entry: _Entry = (loop, queue, filter_fn)
    with _lock:
        _subscribers.append(entry)

    def _unsubscribe() -> None:
        with _lock:
            if entry in _subscribers:
                _subscribers.remove(entry)

    return queue, _unsubscribe


def publish_op(op: dict[str, Any]) -> None:
    """Called from the sorter (sync) thread. Non-blocking: drops on full queues."""
    with _lock:
        snapshot = list(_subscribers)
    for loop, queue, filter_fn in snapshot:
        try:
            if not filter_fn(op):
                continue
        except Exception:
            logger.exception("Subscriber filter raised; dropping op for one client")
            continue
        try:
            loop.call_soon_threadsafe(queue.put_nowait, op)
        except RuntimeError:
            pass
        except asyncio.QueueFull:
            pass


def subscriber_count() -> int:
    with _lock:
        return len(_subscribers)
