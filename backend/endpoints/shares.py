import datetime as dt
from fastapi import APIRouter
import helpers.mongo as mongo
from helpers.types import OpType


router = APIRouter(
    prefix="/shares",
    tags=["Shares"],
    responses={404: {"description": "Not found"}},
)

# Количество SHARES, распределённых за всё время.
@router.get("/all")
def sum_shares() -> dict:
    result = mongo.get_sum_shares_all()
    return {"shares": result, "operation_type": "all", "date": "all"}


# Количество SHARES, распределенных в указанный период.
@router.get("/{to_date_str}/{from_date_str}")
def sum_shares_in_period(
    to_date: dt.datetime = dt.datetime.now(),
    from_date: dt.datetime = dt.datetime.now() - dt.timedelta(hours=1),
) -> dict:
    to_date_str = dt.datetime.strftime(to_date, "%Y-%m-%d %H:%M:%S")
    from_date_str = dt.datetime.strftime(from_date, "%Y-%m-%d %H:%M:%S")
    result = mongo.get_sum_shares_in_period(to_date, from_date)
    return {
        "shares": result,
        "operation_type": "all",
        "date": {"from": from_date_str, "to": to_date_str},
    }


# Количество распределенных SHARES по заданной операции за заданный
# период (минута, час, день, месяц).
@router.get("/{operation_type}/{to_date_str}/{from_date_str}")
def sum_shares_by_op_type_in_period(
    operation_type: OpType = OpType.witness_reward,
    to_date: dt.datetime = dt.datetime.now(),
    from_date: dt.datetime = dt.datetime.now() - dt.timedelta(hours=1),
) -> dict:
    to_date_str = dt.datetime.strftime(to_date, "%Y-%m-%d %H:%M:%S")
    from_date_str = dt.datetime.strftime(from_date, "%Y-%m-%d %H:%M:%S")
    result = mongo.get_sum_shares_by_op_in_period(
        operation_type, to_date, from_date
    )
    return {
        "shares": result,
        "operation_type": operation_type,
        "date": {"from": from_date_str, "to": to_date_str},
    }


# Топ постов в каналах телеграм по полученным SHARES, выдаваемый с разными
# настройками. По умолчанию, топ-5 за неделю.
@router.get(
    "/tg_stats/top_ch_posts_by_shares/{to_date_str}/{from_date_str}/{in_top}/{to_skip}"
)
def show_top_tg_ch_posts_by_shares_in_period(
    to_date: dt.datetime = dt.datetime.now(),
    from_date: dt.datetime = dt.datetime.now() - dt.timedelta(weeks=1),
    in_top: int = 5,
    to_skip: int = 0,
) -> dict:
    to_date_str = dt.datetime.strftime(to_date, "%Y-%m-%d %H:%M:%S")
    from_date_str = dt.datetime.strftime(from_date, "%Y-%m-%d %H:%M:%S")
    result = mongo.get_top_tg_ch_posts_by_shares_in_period(
        to_date, from_date, in_top, to_skip
    )
    return {
        "top_tg_posts_with_shares": result,
        "date": {"from": from_date_str, "to": to_date_str},
    }


# Топ постов в каналах в телеграм по количеству авардов, выдаваемый с разными
# настройками. По умолчанию, топ-5 за неделю.
@router.get(
    "/tg_stats/top_ch_posts_by_aws/{to_date_str}/{from_date_str}/{in_top}/{to_skip}"
)
def show_top_tg_ch_posts_by_awards_count_in_period(
    to_date: dt.datetime = dt.datetime.now(),
    from_date: dt.datetime = dt.datetime.now() - dt.timedelta(weeks=1),
    in_top: int = 5,
    to_skip: int = 0,
) -> dict:
    to_date_str = dt.datetime.strftime(to_date, "%Y-%m-%d %H:%M:%S")
    from_date_str = dt.datetime.strftime(from_date, "%Y-%m-%d %H:%M:%S")
    result = mongo.get_top_tg_ch_posts_by_awards_count_in_period(
        to_date, from_date, in_top, to_skip
    )
    return {
        "top_tg_posts_with_awards": result,
        "date": {"from": from_date_str, "to": to_date_str},
    }


# Количество авардов и SHARES, полученные постом в телеграм-канале за указанный период.
@router.get(
    "/tg_stats/{tg_ch_id}/postnumber/{postnumber}/{to_date_str}/{from_date_str}"
)
def show_tg_ch_post_awards_and_shares_in_period(
    tg_ch_post_link: str = "https://t.me/viz_news/80",
    to_date: dt.datetime = dt.datetime.now(),
    from_date: dt.datetime = dt.datetime.now() - dt.timedelta(weeks=1),
) -> dict:
    to_date_str = dt.datetime.strftime(to_date, "%Y-%m-%d %H:%M:%S")
    from_date_str = dt.datetime.strftime(from_date, "%Y-%m-%d %H:%M:%S")
    postnumber = tg_ch_post_link.split("/")[-1]
    result = mongo.get_tg_ch_post_awards_and_shares_in_period(
        tg_ch_post_link, to_date, from_date
    )
    return result


# Топ каналов в телеграм по полученным SHARES, выдаваемый с разными
# настройками. По умолчанию, топ-5 за неделю.
@router.get(
    "/tg_stats/top_chs/{to_date_str}/{from_date_str}/{in_top}/{to_skip}"
)
def show_top_tg_channels_by_shares_in_period(
    to_date: dt.datetime = dt.datetime.now(),
    from_date: dt.datetime = dt.datetime.now() - dt.timedelta(weeks=1),
    in_top: int = 5,
    to_skip: int = 0,
) -> dict:
    to_date_str = dt.datetime.strftime(to_date, "%Y-%m-%d %H:%M:%S")
    from_date_str = dt.datetime.strftime(from_date, "%Y-%m-%d %H:%M:%S")
    result = mongo.get_top_tg_ch_by_shares_in_period(
        to_date, from_date, in_top, to_skip
    )
    return {
        "top_tg_channels_with_shares": result,
        "date": {"from": from_date_str, "to": to_date_str},
    }


# Топ каналов в телеграм по количеству авардов, выдаваемый с разными
# настройками. По умолчанию, топ-5 за неделю.
@router.get(
    "/tg_stats/top_chs_by_aws/{to_date_str}/{from_date_str}/{in_top}/{to_skip}"
)
def show_top_tg_channels_by_awards_count_in_period(
    to_date: dt.datetime = dt.datetime.now(),
    from_date: dt.datetime = dt.datetime.now() - dt.timedelta(weeks=1),
    in_top: int = 5,
    to_skip: int = 0,
) -> dict:
    to_date_str = dt.datetime.strftime(to_date, "%Y-%m-%d %H:%M:%S")
    from_date_str = dt.datetime.strftime(from_date, "%Y-%m-%d %H:%M:%S")
    result = mongo.get_top_tg_chs_by_awards_count_in_period(
        to_date, from_date, in_top, to_skip
    )
    return {
        "top_tg_channels_with_awards_count": result,
        "date": {"from": from_date_str, "to": to_date_str},
    }


# Количество авардов и SHARES, полученные телеграм-каналом за указанный период.
@router.get("/tg_stats/{tg_ch_id}/{to_date_str}/{from_date_str}")
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


# Топ постов в Readdle.Me по полученным SHARES.
@router.get(
    "/readdle_me_stats/top_posts_by_shares/{to_date_str}/{from_date_str}/{in_top}/{to_skip}"
)
def show_top_readdleme_posts_by_shares_in_period(
    to_date: dt.datetime = dt.datetime.now(),
    from_date: dt.datetime = dt.datetime.now() - dt.timedelta(weeks=1),
    in_top: int = 5,
    to_skip: int = 0,
) -> dict:
    to_date_str = dt.datetime.strftime(to_date, "%Y-%m-%d %H:%M:%S")
    from_date_str = dt.datetime.strftime(from_date, "%Y-%m-%d %H:%M:%S")
    result = mongo.get_top_readdleme_posts_by_shares_in_period(
        to_date, from_date, in_top, to_skip
    )
    return {
        "top_readdle.me_posts_with_shares": result,
        "date": {"from": from_date_str, "to": to_date_str},
    }


# Топ постов в Readdle.Me по количеству авардов.
@router.get(
    "/readdle_me_stats/top_posts_by_awards/{to_date_str}/{from_date_str}/{in_top}/{to_skip}"
)
def show_top_readdleme_posts_by_awards_count_in_period(
    to_date: dt.datetime = dt.datetime.now(),
    from_date: dt.datetime = dt.datetime.now() - dt.timedelta(weeks=1),
    in_top: int = 5,
    to_skip: int = 0,
) -> dict:
    to_date_str = dt.datetime.strftime(to_date, "%Y-%m-%d %H:%M:%S")
    from_date_str = dt.datetime.strftime(from_date, "%Y-%m-%d %H:%M:%S")
    result = mongo.get_top_readdleme_posts_by_awards_in_period(
        to_date, from_date, in_top, to_skip
    )
    return {
        "top_readdle.me_posts_with_awards": result,
        "date": {"from": from_date_str, "to": to_date_str},
    }


# Количество авардов и SHARES, полученные постом в Readdle.Me за указанный период.
@router.get(
    "/readdle_me_stats/{readdleme_author}/postnumber/{post_number}/{to_date_str}/{from_date_str}"
)
def show_readdleme_post_awards_and_received_shares_in_period(
    link_to_post: str = "https://readdle.me/#viz://@readdle/22099872/",
    to_date: dt.datetime = dt.datetime.now(),
    from_date: dt.datetime = dt.datetime.now() - dt.timedelta(weeks=1),
) -> dict:
    to_date_str = dt.datetime.strftime(to_date, "%Y-%m-%d %H:%M:%S")
    from_date_str = dt.datetime.strftime(from_date, "%Y-%m-%d %H:%M:%S")
    postnumber = link_to_post.split("/")[-2]
    result = mongo.get_readdleme_post_awards_and_shares_in_period(
        link_to_post, to_date, from_date
    )
    return result
