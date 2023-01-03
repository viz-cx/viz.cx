"""Helper module for API"""
from fastapi import APIRouter
from endpoints import count_tx, others, readdle_me, shares, tg_stats

router = APIRouter()
router.include_router(others.router)
router.include_router(count_tx.router)
router.include_router(shares.router)
router.include_router(readdle_me.router)
router.include_router(tg_stats.router)
