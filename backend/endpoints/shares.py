import datetime as dt

from fastapi import APIRouter

import helpers.mongo as mongo
from helpers.dates import iso8601, utcnow
from helpers.enums import OpType

router = APIRouter(
    prefix="/shares",
    tags=["Shares"],
    responses={404: {"description": "Not found"}},
)


@router.get("/all")
def sum_shares() -> dict:
    return {"shares": mongo.get_sum_shares_all(), "operation_type": "all", "date": "all"}


@router.get("/{to_date_str}/{from_date_str}")
def sum_shares_in_period(
    to_date_str: str | None = None,
    from_date_str: str | None = None,
) -> dict:
    to_date = dt.datetime.fromisoformat(to_date_str) if to_date_str else utcnow()
    from_date = (
        dt.datetime.fromisoformat(from_date_str)
        if from_date_str
        else to_date - dt.timedelta(hours=1)
    )
    result = mongo.get_sum_shares_in_period(to_date, from_date)
    return {
        "shares": result,
        "operation_type": "all",
        "date": {"from": iso8601(from_date), "to": iso8601(to_date)},
    }


@router.get("/{operation_type}/{to_date_str}/{from_date_str}")
def sum_shares_by_op_type_in_period(
    operation_type: OpType = OpType.witness_reward,
    to_date_str: str | None = None,
    from_date_str: str | None = None,
) -> dict:
    to_date = dt.datetime.fromisoformat(to_date_str) if to_date_str else utcnow()
    from_date = (
        dt.datetime.fromisoformat(from_date_str)
        if from_date_str
        else to_date - dt.timedelta(hours=1)
    )
    result = mongo.get_sum_shares_by_op_in_period(operation_type, to_date, from_date)
    return {
        "shares": result,
        "operation_type": operation_type,
        "date": {"from": iso8601(from_date), "to": iso8601(to_date)},
    }
