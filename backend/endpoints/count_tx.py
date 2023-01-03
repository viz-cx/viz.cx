import helpers.mongo as mongo
from fastapi import APIRouter
import datetime as dt

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


# Количество всех операций в блокчейне за заданный период с указанной даты.
@router.get("/{to_date_str}/{period_in_seconds}")
def count_ops_in_period(
    to_date: dt.datetime = dt.datetime.now(),
    period: dt.timedelta = dt.timedelta(hours=1),
) -> dict:
    to_date_str = dt.datetime.strftime(to_date, "%Y-%m-%d %H:%M:%S")
    from_date_str = dt.datetime.strftime(to_date - period, "%Y-%m-%d %H:%M:%S")
    result = mongo.get_ops_count_in_period(to_date, dt.datetime.now() - period)
    return {
        "operations": result,
        "operation_type": "all",
        "date": {"from": from_date_str, "to": to_date_str},
    }


# Количество операций по заданному типу за всё время.
@router.get("/{operation_type}")
def count_ops_by_op_type(
    operation_type: OpType = OpType.witness_reward,
) -> dict:
    result = mongo.get_ops_count_by_type(operation_type)
    return {
        "operations": result,
        "operation_type": operation_type,
        "date": "all",
    }


# Количество операций по заданному типу за заданный период (минута,
# час, день, неделя, месяц).
@router.get("/{operation_type}/{to_date_str}/{period_in_seconds}")
def count_ops_by_op_type_in_period(
    operation_type: OpType = OpType.witness_reward,
    to_date: dt.datetime = dt.datetime.now(),
    period: dt.timedelta = dt.timedelta(hours=1),
) -> dict:
    to_date_str = dt.datetime.strftime(to_date, "%Y-%m-%d %H:%M:%S")
    from_date_str = dt.datetime.strftime(to_date - period, "%Y-%m-%d %H:%M:%S")
    result = mongo.get_ops_count_by_type_in_period(
        operation_type, to_date, dt.datetime.now() - period
    )
    return {
        "operations": result,
        "operation_type": operation_type,
        "date": {"from": from_date_str, "to": to_date_str},
    }
