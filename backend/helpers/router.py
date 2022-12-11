"""Helper module for API"""
from fastapi import APIRouter
from endpoints import count_tx, others, shares

router = APIRouter()
router.include_router(others.router)
router.include_router(count_tx.router)
router.include_router(shares.router)
