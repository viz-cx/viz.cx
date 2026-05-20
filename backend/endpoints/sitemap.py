import datetime as dt

from fastapi import APIRouter, Query
from pydantic import BaseModel

from helpers.mongo import get_saved_posts

router = APIRouter(
    prefix="/sitemap",
    tags=["Sitemaps"],
    responses={404: {"description": "Not found"}},
)

BASE_URL = "https://viz.cx"
MAX_PAGE_SIZE = 1000


class SitemapEntry(BaseModel):
    loc: str
    lastmod: dt.datetime
    priority: str
    changefreq: str


class SitemapPageResponse(BaseModel):
    items: list[SitemapEntry]
    page: int
    has_more: bool


@router.get("/posts", response_model=SitemapPageResponse)
def show_posts_urls(
    page: int = Query(default=0, ge=0),
    limit: int = Query(default=MAX_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
) -> SitemapPageResponse:
    """Paginated post URL list. Callers iterate `page` until `has_more` is false."""
    posts = get_saved_posts(page=page, limit=limit, isReplies=False)
    items = [
        SitemapEntry(
            loc=f"{BASE_URL}/@{post['author']}/{post['block']}",
            lastmod=post["timestamp"],
            priority="0.8",
            changefreq="weekly",
        )
        for post in posts
    ]
    return SitemapPageResponse(
        items=items,
        page=page,
        has_more=len(items) == limit,
    )
