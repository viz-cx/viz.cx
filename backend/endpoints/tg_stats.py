import datetime as dt
from fastapi import APIRouter
import helpers.mongo as mongo


router = APIRouter(
    prefix="/tg_stats",
    tags=["Stats"],
    responses={404: {"description": "Not found"}},
)

# Топ постов в каналах телеграм по полученным SHARES, выдаваемый с разными
# настройками. По умолчанию, топ-10 за неделю.
@router.get(
    "/top_tg_posts_by_shares/{to_date_str}/{from_date_str}/{in_top}/{to_skip}"
)
def show_top_tg_ch_posts_by_shares_in_period(
    to_date: dt.datetime = dt.datetime.now(),
    from_date: dt.datetime = dt.datetime.now() - dt.timedelta(weeks=1),
    in_top: int = 10,
    to_skip: int = 0,
) -> dict:
    to_date_str = dt.datetime.strftime(to_date, "%Y-%m-%d %H:%M:%S")
    from_date_str = dt.datetime.strftime(from_date, "%Y-%m-%d %H:%M:%S")
    result = mongo.get_top_tg_ch_posts_by_shares_in_period(
        to_date, from_date, in_top, to_skip
    )
    return {
        "posts": result,
        "date": {"from": from_date_str, "to": to_date_str},
    }


# Топ постов в каналах в телеграм по количеству авардов, выдаваемый с разными
# настройками. По умолчанию, топ-10 за неделю.
@router.get("/top_tg_posts_by_awards/{to_date}/{from_date}/{in_top}/{to_skip}")
def show_top_tg_posts_by_awards_count_in_period(
    to_date: dt.datetime = dt.datetime.now(),
    from_date: dt.datetime = dt.datetime.now() - dt.timedelta(weeks=1),
    in_top: int = 10,
    to_skip: int = 0,
) -> dict:
    to_date_str = dt.datetime.strftime(to_date, "%Y-%m-%d %H:%M:%S")
    from_date_str = dt.datetime.strftime(from_date, "%Y-%m-%d %H:%M:%S")
    result = mongo.get_top_tg_ch_posts_by_awards_count_in_period(
        to_date, from_date, in_top, to_skip
    )
    return {
        "posts": result,
        "date": {"from": from_date_str, "to": to_date_str},
    }


# Количество авардов и SHARES, полученные постом в телеграм-канале за указанный период.
@router.get("/{tg_ch_post_link}/{to_date_str}/{from_date_str}")
def show_tg_ch_post_awards_and_shares_in_period(
    tg_post_link: str = "https://t.me/viz_news/80",
    to_date: dt.datetime = dt.datetime.now(),
    from_date: dt.datetime = dt.datetime.now() - dt.timedelta(weeks=1),
) -> dict:
    to_date_str = dt.datetime.strftime(to_date, "%Y-%m-%d %H:%M:%S")
    from_date_str = dt.datetime.strftime(from_date, "%Y-%m-%d %H:%M:%S")
    # postnumber = tg_ch_post_link.split("/")[-1]
    result = mongo.get_tg_ch_post_awards_and_shares_in_period(
        tg_post_link, to_date, from_date
    )
    return {
        "post": tg_post_link,
        "date": {"from": from_date_str, "to": to_date_str},
    }


# Топ каналов в телеграм по полученным SHARES, выдаваемый с разными
# настройками. По умолчанию, топ-10 за неделю.
@router.get("/top_channels/{to_date}/{from_date}/{in_top}/{to_skip}")
def show_top_tg_channels_by_shares_in_period(
    to_date: dt.datetime = dt.datetime.now(),
    from_date: dt.datetime = dt.datetime.now() - dt.timedelta(weeks=1),
    in_top: int = 10,
    to_skip: int = 0,
) -> dict:
    to_date_str = dt.datetime.strftime(to_date, "%Y-%m-%d %H:%M:%S")
    from_date_str = dt.datetime.strftime(from_date, "%Y-%m-%d %H:%M:%S")
    result = mongo.get_top_tg_ch_by_shares_in_period(
        to_date, from_date, in_top, to_skip
    )
    return {
        "channels": result,
        "date": {"from": from_date_str, "to": to_date_str},
    }


# Топ каналов в телеграм по количеству авардов, выдаваемый с разными
# настройками. По умолчанию, топ-10 за неделю.
@router.get("/top_channels_by_awards/{to_date}/{from_date}/{in_top}/{to_skip}")
def show_top_tg_channels_by_awards_count_in_period(
    to_date: dt.datetime = dt.datetime.now(),
    from_date: dt.datetime = dt.datetime.now() - dt.timedelta(weeks=1),
    in_top: int = 10,
    to_skip: int = 0,
) -> dict:
    to_date_str = dt.datetime.strftime(to_date, "%Y-%m-%d %H:%M:%S")
    from_date_str = dt.datetime.strftime(from_date, "%Y-%m-%d %H:%M:%S")
    result = mongo.get_top_tg_chs_by_awards_count_in_period(
        to_date, from_date, in_top, to_skip
    )
    return {
        "channels": result,
        "date": {"from": from_date_str, "to": to_date_str},
    }


# Количество авардов и SHARES, полученные телеграм-каналом за указанный период.
@router.get("/{tg_ch_id}/{to_date_str}/{from_date_str}")
def show_tg_channel_awards_and_received_shares_in_period(
    tg_ch_id: str = "@viz_news",
    to_date: dt.datetime = dt.datetime.now(),
    from_date: dt.datetime = dt.datetime.now() - dt.timedelta(weeks=1),
) -> dict:
    to_date_str = dt.datetime.strftime(to_date, "%Y-%m-%d %H:%M:%S")
    from_date_str = dt.datetime.strftime(from_date, "%Y-%m-%d %H:%M:%S")
    result = mongo.get_tg_ch_awards_and_shares_in_period(
        tg_ch_id, to_date, from_date
    )
    return result
