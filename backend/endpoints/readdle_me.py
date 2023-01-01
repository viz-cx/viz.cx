import datetime as dt
from fastapi import APIRouter
import helpers.mongo as mongo


router = APIRouter(
    prefix="/readdle_me",
    tags=["Readdle.me"],
    responses={404: {"description": "Not found"}},
)

# Топ постов в Readdle.Me по полученным SHARES.
@router.get(
    "/top_posts_by_shares/{to_date_str}/{from_date_str}/{in_top}/{to_skip}"
)
def show_top_readdleme_posts_by_shares_in_period(
    to_date: dt.datetime = dt.datetime.now(),
    from_date: dt.datetime = dt.datetime.now() - dt.timedelta(weeks=1),
    in_top: int = 10,
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
    "/top_posts_by_awards/{to_date_str}/{from_date_str}/{in_top}/{to_skip}"
)
def show_top_readdleme_posts_by_awards_count_in_period(
    to_date: dt.datetime = dt.datetime.now(),
    from_date: dt.datetime = dt.datetime.now() - dt.timedelta(weeks=1),
    in_top: int = 10,
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
    "/{readdleme_author}/postnumber/{post_number}/{to_date_str}/{from_date_str}"
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
