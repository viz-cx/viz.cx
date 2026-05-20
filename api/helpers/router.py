"""Helper module for API"""
from fastapi import APIRouter

from endpoints import (
    accounts,
    auth,
    blocks,
    count_tx,
    others,
    posts,
    profile,
    shares,
    sitemap,
    telegram,
    voice,
    webhooks,
    ws,
)

router = APIRouter()
router.include_router(others.router)
router.include_router(auth.router)
router.include_router(blocks.router)
router.include_router(count_tx.router)
router.include_router(shares.router)
router.include_router(voice.router)
router.include_router(telegram.router)
router.include_router(posts.router)
router.include_router(profile.router)
router.include_router(sitemap.router)
router.include_router(accounts.router)
router.include_router(webhooks.router)
router.include_router(ws.router)
