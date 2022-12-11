from helpers.mongo import get_all_blocks_count_in_db_in_period, get_all_tx_count_in_db, get_tx_number, get_tx_number_in_db_in_period
from fastapi import APIRouter
import datetime as dt

router = APIRouter(
    prefix="/count_tx",
    tags=["Count"],
    responses={404: {"description": "Not found"}},
)


@router.get("/all")
def count_all_tx() -> dict:
    result = get_all_tx_count_in_db()
    return {"transactions": result, "operation_type": "all", "date": "all"}


# Количество всех операций в блокчейне за заданный период с указанной даты.
@router.get("/{to_date_str}/{period_in_seconds}")
def count_all_tx_in_period(
    to_date: dt.datetime = dt.datetime.now(),
    period: dt.timedelta = dt.timedelta(hours=1),
) -> dict:
    to_date_str = dt.datetime.strftime(to_date, "%Y-%m-%d %H:%M:%S")
    from_date_str = dt.datetime.strftime(to_date - period, "%Y-%m-%d %H:%M:%S")
    result = get_all_blocks_count_in_db_in_period(to_date, period)
    return {
        "transactions": result,
        "operation_type": "all",
        "date": {"from": from_date_str, "to": to_date_str},
    }


# Количество операций по заданному типу за всё время.
@router.get("/{operation_type}")
def count_tx_by_op_type(operation_type: str = "witness_reward") -> dict:
    result = get_tx_number(operation_type)
    return {"transactions": result, "operation_type": operation_type, "date": "all"}


# Количество операций по заданному типу за заданный период (минута,
# час, день, неделя, месяц).
@router.get("/{operation_type}/{to_date_str}/{period_in_seconds}")
def count_tx_by_op_type_in_period(
    operation_type: str = "witness_reward",
    to_date: dt.datetime = dt.datetime.now(),
    period: dt.timedelta = dt.timedelta(hours=1),
) -> dict:
    to_date_str = dt.datetime.strftime(to_date, "%Y-%m-%d %H:%M:%S")
    from_date_str = dt.datetime.strftime(to_date - period, "%Y-%m-%d %H:%M:%S")
    result = get_tx_number_in_db_in_period(operation_type, to_date, period)
    return {
        "transactions": result,
        "operation_type": operation_type,
        "date": {"from": from_date_str, "to": to_date_str},
    }
