import datetime as dt
from fastapi import APIRouter
from helpers.dates import parse_date_string, iso8601
import helpers.mongo as mongo
from helpers.enums import SelectType


router = APIRouter(
    prefix="/readdle_me",
    tags=["Readdle.me"],
    responses={404: {"description": "Not found"}},
)

# Топ постов в Readdle.Me по полученным SHARES или по количеству авардов.
@router.get("/top_posts")
def show_top_readdleme_posts_in_period(
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
            result = mongo.get_top_readdleme_posts_by_shares_in_period(
                to, _from, in_top, to_skip
            )
        case SelectType.awards:
            result = mongo.get_top_readdleme_posts_by_awards_in_period(
                to, _from, in_top, to_skip
            )
    return {"posts": result, "date": {"from": _from, "to": to}}


# Количество авардов и SHARES, полученные постом в Readdle.Me за указанный период.
@router.get("/post")
def show_readdleme_post_awards_and_received_shares_in_period(
    link_to_post: str = "https://readdle.me/#viz://@readdle/22099872/",
    to_date: str = iso8601(dt.datetime.utcnow()),
    from_date: str = iso8601(dt.datetime.utcnow() - dt.timedelta(weeks=1)),
) -> dict:
    to = parse_date_string(to_date)
    _from = parse_date_string(from_date)
    result = mongo.get_readdleme_post_awards_and_shares_in_period(
        link_to_post, to, _from
    )
    return result


# Топ аккаунтов в Readdle.Me по полученным SHARES или по количеству авардов.
@router.get("/top_accounts")
def show_top_accounts_in_period(
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
            result = mongo.get_top_readdleme_authors_by_shares_in_period(
                to, _from, in_top, to_skip
            )
        case SelectType.awards:
            result = mongo.get_top_readdleme_authors_by_awards_in_period(
                to, _from, in_top, to_skip
            )
    return {"accounts": result, "date": {"from": _from, "to": to}}


# Количество авардов и SHARES, полученные аккаунтом Readdle.Me за указанный период.
@router.get("/account")
def show_account_awards_and_received_shares_in_period(
    account_id: str = "@readdle",
    to_date: str = iso8601(dt.datetime.utcnow()),
    from_date: str = iso8601(dt.datetime.utcnow() - dt.timedelta(weeks=1)),
) -> dict:
    to = parse_date_string(to_date)
    _from = parse_date_string(from_date)
    result = mongo.get_readdleme_author_awards_and_shares_in_period(
        account_id, to, _from
    )
    return result
