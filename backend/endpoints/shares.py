import datetime as dt
from fastapi import APIRouter
from helpers.mongo import get_sum_shares_all, get_sum_shares_by_op_in_period, get_sum_shares_in_period


router = APIRouter(
    prefix="/shares",
    tags=["Shares"],
    responses={404: {"description": "Not found"}},
)

# Количество SHARES, распределённых за всё время.
@router.get("/all")
def shares_all() -> dict:
    result = get_sum_shares_all()
    return {"shares": result, "operation type": "all", "date": "all"}


# Количество SHARES, распределенных в указанный период.
@router.get("/{to_date_str}/{period_in_seconds}")
def shares_all_in_period(
    to_date: dt.datetime = dt.datetime.now(),
    period: dt.timedelta = dt.timedelta(hours=1),
) -> dict:
    to_date_str = dt.datetime.strftime(to_date, "%Y-%m-%d %H:%M:%S")
    from_date_str = dt.datetime.strftime(to_date - period, "%Y-%m-%d %H:%M:%S")
    period_in_seconds = period.seconds
    result = get_sum_shares_in_period(to_date, period)
    return {
        "shares": result,
        "operation type": "all",
        "date": {"from": from_date_str, "to": to_date_str},
    }


# Количество распределенных SHARES по заданной операции за заданный
# период (минута, час, день, месяц).
@router.get("/{operation_type}/{to_date_str}/{period_in_seconds}")
def shares_by_op_type_in_period(
    operation_type: str = "witness_reward",
    to_date: dt.datetime = dt.datetime.now(),
    period: dt.timedelta = dt.timedelta(hours=1),
) -> dict:
    to_date_str = dt.datetime.strftime(to_date, "%Y-%m-%d %H:%M:%S")
    from_date_str = dt.datetime.strftime(to_date - period, "%Y-%m-%d %H:%M:%S")
    period_in_seconds = period.seconds
    result = get_sum_shares_by_op_in_period(
        operation_type, to_date, period)
    return {
        "shares": result,
        "operation type": operation_type,
        "date": {"from": from_date_str, "to": to_date_str},
    }
