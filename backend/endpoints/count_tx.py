import datetime as dt

from fastapi import APIRouter

import helpers.mongo as mongo
from helpers.dates import iso8601, utcnow
from helpers.enums import OpType

router = APIRouter(
    prefix="/count_ops",
    tags=["Count"],
    responses={404: {"description": "Not found"}},
)


@router.get("/all")
def count_ops() -> dict:
    result = mongo.get_ops_count()
    return {"operations": result, "operation_type": "all", "date": "all"}


@router.get("/{to_date_str}/{period_in_seconds}")
def count_ops_in_period(
    to_date_str: str | None = None,
    period_in_seconds: int = 3600,
) -> dict:
    to_date = dt.datetime.fromisoformat(to_date_str) if to_date_str else utcnow()
    period = dt.timedelta(seconds=period_in_seconds)
    from_date = to_date - period
    result = mongo.get_ops_count_in_period(to_date, from_date)
    return {
        "operations": result,
        "operation_type": "all",
        "date": {"from": iso8601(from_date), "to": iso8601(to_date)},
    }


@router.get("/{operation_type}")
def count_ops_by_op_type(operation_type: OpType = OpType.witness_reward) -> dict:
    result = mongo.get_ops_count_by_type(operation_type)
    return {"operations": result, "operation_type": operation_type, "date": "all"}


@router.get("/{operation_type}/{to_date_str}/{period_in_seconds}")
def count_ops_by_op_type_in_period(
    operation_type: OpType = OpType.witness_reward,
    to_date_str: str | None = None,
    period_in_seconds: int = 3600,
) -> dict:
    to_date = dt.datetime.fromisoformat(to_date_str) if to_date_str else utcnow()
    period = dt.timedelta(seconds=period_in_seconds)
    from_date = to_date - period
    result = mongo.get_ops_count_by_type_in_period(operation_type, to_date, from_date)
    return {
        "operations": result,
        "operation_type": operation_type,
        "date": {"from": iso8601(from_date), "to": iso8601(to_date)},
    }
