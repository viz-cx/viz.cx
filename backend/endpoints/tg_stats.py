import datetime as dt
from fastapi import APIRouter, Query
import helpers.mongo as mongo
from helpers.types import ByType


router = APIRouter(
    prefix="/tg_stats",
    tags=["Stats"],
    responses={404: {"description": "Not found"}},
)

# Топ постов в каналах телеграм по полученным SHARES или по количеству авардов,
# выдаваемый с разными настройками. По умолчанию, топ-10 за неделю.
@router.get("/top_posts")
def show_top_tg_ch_posts_by_shares_in_period(
    by: ByType,
    to_date: dt.datetime = dt.datetime.now(),
    from_date: dt.datetime = dt.datetime.now() - dt.timedelta(weeks=1),
    in_top: int = 10,
    to_skip: int = 0,
) -> dict:
    to_date_str = dt.datetime.strftime(to_date, "%Y-%m-%d %H:%M:%S")
    from_date_str = dt.datetime.strftime(from_date, "%Y-%m-%d %H:%M:%S")
    match by:
        case ByType.by_shares:
            result = mongo.get_top_tg_ch_posts_by_shares_in_period(
                to_date, from_date, in_top, to_skip
            )
        case ByType.by_count:
            result = mongo.get_top_tg_ch_posts_by_awards_count_in_period(
                to_date, from_date, in_top, to_skip
            )

    return {
        "posts": result,
        "date": {"from": from_date_str, "to": to_date_str},
    }


# Топ каналов в телеграм по полученным SHARES или количеству авардов,
# выдаваемый с разными настройками. По умолчанию, топ-10 за неделю.
@router.get("/top_channels")
def show_top_tg_channels_in_period(
    by: ByType,
    to_date_str: str = Query(
        default=dt.datetime.now().isoformat(),
    ),
    from_date_str: str = Query(
        default=(dt.datetime.now() - dt.timedelta(weeks=1)).isoformat(),
    ),
    in_top: int = 10,
    to_skip: int = 0,
) -> dict:
    to_date = dt.datetime.fromisoformat(to_date_str)
    from_date = dt.datetime.fromisoformat(from_date_str)
    match by:
        case ByType.by_shares:
            result = mongo.get_top_tg_ch_by_shares_in_period(
                to_date, from_date, in_top, to_skip
            )
        case ByType.by_count:
            result = mongo.get_top_tg_chs_by_awards_count_in_period(
                to_date, from_date, in_top, to_skip
            )
    return {
        "channels": result,
        "date": {"from": from_date_str, "to": to_date_str},
    }


# Количество авардов и SHARES, полученные телеграм-каналом за указанный период.
@router.get("/channel")
def show_tg_channel_awards_and_received_shares_in_period(
    tg_ch_id: str = "@viz_news",
    to_date_str: str = dt.datetime.now().isoformat(),
    from_date_str: str = (
        dt.datetime.now() - dt.timedelta(weeks=1)
    ).isoformat(),
) -> dict:
    to_date = dt.datetime.fromisoformat(to_date_str)
    from_date = dt.datetime.fromisoformat(from_date_str)
    result = mongo.get_tg_ch_awards_and_shares_in_period(
        tg_ch_id, to_date, from_date
    )
    return result


# Количество авардов и SHARES, полученные постом в телеграм-канале за указанный период.
@router.get("/post")
def show_tg_ch_post_awards_and_shares_in_period(
    tg_post_link: str = "https://t.me/viz_news/80",
    to_date_str: str = dt.datetime.now().isoformat(),
    from_date_str: str = (
        dt.datetime.now() - dt.timedelta(weeks=1)
    ).isoformat(),
) -> dict:
    to_date = dt.datetime.fromisoformat(to_date_str)
    from_date = dt.datetime.fromisoformat(from_date_str)
    result = mongo.get_tg_ch_post_awards_and_shares_in_period(
        tg_post_link, to_date, from_date
    )
    return {
        "post": result,
        "date": {"from": from_date_str, "to": to_date_str},
    }
