import datetime as dt

from fastapi import APIRouter

import helpers.mongo as mongo
from helpers.dates import iso8601, resolve_window
from helpers.enums import SelectType

router = APIRouter(
    prefix="/voice",
    tags=["Voice Protocol"],
    responses={404: {"description": "Not found"}},
)

_WEEK = dt.timedelta(weeks=1)


@router.get("/top_posts")
async def show_top_posts_in_period(
    by: SelectType,
    to_date: str | None = None,
    from_date: str | None = None,
    in_top: int = 10,
    to_skip: int = 0,
) -> dict:
    to, fr = resolve_window(to_date, from_date, _WEEK)
    if by == SelectType.shares:
        result = await mongo.get_top_readdleme_posts_by_shares_in_period(to, fr, in_top, to_skip)
    else:
        result = await mongo.get_top_readdleme_posts_by_awards_in_period(to, fr, in_top, to_skip)
    return {"posts": result, "date": {"from": iso8601(fr), "to": iso8601(to)}}


@router.get("/@{author}/{block}")
async def show_readdleme_post_awards_and_received_shares(author: str, block: int) -> dict:
    return await mongo.aget_readdleme_post_awards_and_shares(author, block)


@router.get("/top_accounts")
async def show_top_accounts_in_period(
    by: SelectType,
    to_date: str | None = None,
    from_date: str | None = None,
    in_top: int = 10,
    to_skip: int = 0,
) -> dict:
    to, fr = resolve_window(to_date, from_date, _WEEK)
    if by == SelectType.shares:
        result = await mongo.get_top_readdleme_authors_by_shares_in_period(to, fr, in_top, to_skip)
    else:
        result = await mongo.get_top_readdleme_authors_by_awards_in_period(to, fr, in_top, to_skip)
    return {"accounts": result, "date": {"from": iso8601(fr), "to": iso8601(to)}}


@router.get("/account")
async def show_account_awards_and_received_shares_in_period(
    account_id: str = "@readdle",
    to_date: str | None = None,
    from_date: str | None = None,
) -> dict:
    to, fr = resolve_window(to_date, from_date, _WEEK)
    return await mongo.get_readdleme_author_awards_and_shares_in_period(account_id, to, fr)
