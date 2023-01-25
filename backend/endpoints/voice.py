import datetime as dt
from fastapi import APIRouter
from helpers.enums import SelectType
from helpers.dates import parse_date_string, iso8601
import helpers.mongo as mongo


router = APIRouter(
    prefix="/voice",
    tags=["Voice Protocol"],
    responses={404: {"description": "Not found"}},
)


@router.get("/top_posts")
def show_top_posts_in_period(
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
    return {
        "posts": result,
        "date": {"from": from_date, "to": to_date},
    }


# Количество авардов и SHARES, полученные постом за указанный период
@router.get("/post")
def show_readdleme_post_awards_and_received_shares_in_period(
    link_to_post: str = "viz://@readdle/22099872/",
    to_date: str = iso8601(dt.datetime.utcnow()),
    from_date: str = iso8601(dt.datetime.utcnow() - dt.timedelta(weeks=1)),
) -> dict:
    to = parse_date_string(to_date)
    _from = parse_date_string(from_date)
    result = mongo.get_readdleme_post_awards_and_shares_in_period(
        link_to_post, to, _from
    )
    return result


# Топ аккаунтов по полученным SHARES или по количеству авардов
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


# Количество авардов и SHARES, полученные аккаунтом за указанный период
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
