import datetime as dt
from fastapi import APIRouter
from helpers.dates import parse_date_string, iso8601
import helpers.mongo as mongo
from helpers.enums import SelectType


router = APIRouter(
    prefix="/tg_stats",
    tags=["Stats"],
    responses={404: {"description": "Not found"}},
)

# Топ постов в каналах телеграм по полученным SHARES или по количеству авардов,
# выдаваемый с разными настройками. По умолчанию, топ-10 за неделю.
@router.get("/top_posts")
def show_top_tg_ch_posts_by_shares_in_period(
    by: SelectType,
    to_date: str = iso8601(dt.datetime.utcnow()),
    from_date: str = iso8601(dt.datetime.utcnow() - dt.timedelta(weeks=1)),
    in_top: int = 10,
    to_skip: int = 0,
) -> dict:
    to = parse_date_string(to_date)
    _from = parse_date_string(from_date)
    match by:
        case SelectType.shares:
            result = mongo.get_top_tg_posts_by_shares_in_period(
                to, _from, in_top, to_skip
            )
        case SelectType.awards:
            result = mongo.get_top_tg_posts_by_awards_count_in_period(
                to, _from, in_top, to_skip
            )
    return {
        "posts": result,
        "date": {"from": _from, "to": to},
    }


# Топ каналов в телеграм по полученным SHARES или количеству авардов,
# выдаваемый с разными настройками. По умолчанию, топ-10 за неделю.
@router.get("/top_channels")
def show_top_tg_channels_in_period(
    by: SelectType,
    to_date: str = iso8601(dt.datetime.utcnow()),
    from_date: str = iso8601(dt.datetime.utcnow() - dt.timedelta(weeks=1)),
    in_top: int = 10,
    to_skip: int = 0,
) -> dict:
    to = parse_date_string(to_date)
    _from = parse_date_string(from_date)
    match by:
        case SelectType.shares:
            result = mongo.get_top_tg_ch_by_shares_in_period(
                to, _from, in_top, to_skip
            )
        case SelectType.awards:
            result = mongo.get_top_tg_chs_by_awards_count_in_period(
                to, _from, in_top, to_skip
            )
    return {
        "channels": result,
        "date": {"from": _from, "to": to},
    }


# Количество авардов и SHARES, полученные телеграм-каналом за указанный период.
@router.get("/channel")
def show_tg_channel_awards_and_received_shares_in_period(
    tg_ch_id: str = "@viz_news",
    to_date: str = iso8601(dt.datetime.utcnow()),
    from_date: str = iso8601(dt.datetime.utcnow() - dt.timedelta(weeks=1)),
) -> dict:
    to = parse_date_string(to_date)
    _from = parse_date_string(from_date)
    result = mongo.get_tg_ch_awards_and_shares_in_period(tg_ch_id, to, _from)
    return result


# Количество авардов и SHARES, полученные постом в телеграм-канале за указанный период.
@router.get("/post")
def show_tg_ch_post_awards_and_shares_in_period(
    tg_post_link: str = "https://t.me/viz_news/80",
    to_date: str = iso8601(dt.datetime.utcnow()),
    from_date: str = iso8601(dt.datetime.utcnow() - dt.timedelta(weeks=1)),
) -> dict:
    to = parse_date_string(to_date)
    _from = parse_date_string(from_date)
    result = mongo.get_tg_ch_post_awards_and_shares_in_period(
        tg_post_link, to, _from
    )
    return {
        "post": result,
        "date": {"from": _from, "to": to},
    }
