"""Helper module for API"""
from fastapi import APIRouter

from endpoints import (
    auth,
    blocks,
    others,
    profile,
    webhooks,
    ws,
)

router = APIRouter()
router.include_router(others.router)
router.include_router(auth.router)
router.include_router(blocks.router)
router.include_router(profile.router)
router.include_router(webhooks.router)
router.include_router(ws.router)
