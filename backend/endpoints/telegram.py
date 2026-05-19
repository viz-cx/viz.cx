import datetime as dt

from fastapi import APIRouter

import helpers.mongo as mongo
from helpers.dates import iso8601, resolve_window
from helpers.enums import SelectType

router = APIRouter(
    prefix="/telegram",
    tags=["Telegram"],
    responses={404: {"description": "Not found"}},
)

_WEEK = dt.timedelta(weeks=1)


@router.get("/top_posts")
def show_top_tg_ch_posts_by_shares_in_period(
    by: SelectType,
    to_date: str | None = None,
    from_date: str | None = None,
    in_top: int = 10,
    to_skip: int = 0,
) -> dict:
    to, fr = resolve_window(to_date, from_date, _WEEK)
    if by == SelectType.shares:
        result = mongo.get_top_tg_posts_by_shares_in_period(to, fr, in_top, to_skip)
    else:
        result = mongo.get_top_tg_posts_by_awards_count_in_period(to, fr, in_top, to_skip)
    return {"posts": result, "date": {"from": iso8601(fr), "to": iso8601(to)}}


@router.get("/top_channels")
def show_top_tg_channels_in_period(
    by: SelectType,
    to_date: str | None = None,
    from_date: str | None = None,
    in_top: int = 10,
    to_skip: int = 0,
) -> dict:
    to, fr = resolve_window(to_date, from_date, _WEEK)
    if by == SelectType.shares:
        result = mongo.get_top_tg_ch_by_shares_in_period(to, fr, in_top, to_skip)
    else:
        result = mongo.get_top_tg_chs_by_awards_count_in_period(to, fr, in_top, to_skip)
    return {"channels": result, "date": {"from": iso8601(fr), "to": iso8601(to)}}


@router.get("/channel")
def show_tg_channel_awards_and_received_shares_in_period(
    tg_ch_id: str = "@viz_news",
    to_date: str | None = None,
    from_date: str | None = None,
) -> dict:
    to, fr = resolve_window(to_date, from_date, _WEEK)
    return mongo.get_tg_ch_awards_and_shares_in_period(tg_ch_id, to, fr)


@router.get("/post")
def show_tg_ch_post_awards_and_shares_in_period(
    tg_post_link: str = "https://t.me/viz_news/80",
    to_date: str | None = None,
    from_date: str | None = None,
) -> dict:
    to, fr = resolve_window(to_date, from_date, _WEEK)
    result = mongo.get_tg_ch_post_awards_and_shares_in_period(tg_post_link, to, fr)
    return {"post": result, "date": {"from": iso8601(fr), "to": iso8601(to)}}
