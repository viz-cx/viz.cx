import datetime as dt

from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict, Field

from helpers import rollups
from helpers.dates import iso8601, resolve_window, utcnow
from helpers.enums import OpType

router = APIRouter(
    prefix="/count_ops",
    tags=["Count"],
    responses={404: {"description": "Not found"}},
)


class DateRange(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    from_: str | None = Field(default=None, alias="from")
    to: str | None = None


class CountResponse(BaseModel):
    operations: int
    operation_type: str
    date: DateRange | str


class SeriesPoint(BaseModel):
    hour: dt.datetime
    op_type: str
    count: int
    shares: float


class CountSeriesResponse(BaseModel):
    operation_type: str
    date: DateRange
    points: list[SeriesPoint]


@router.get("/all", response_model=CountResponse)
def count_ops() -> CountResponse:
    return CountResponse(
        operations=rollups.get_count(),
        operation_type="all",
        date="all",
    )


@router.get("/series", response_model=CountSeriesResponse)
def count_ops_series(
    operation_type: OpType | None = None,
    from_date: str | None = None,
    to_date: str | None = None,
) -> CountSeriesResponse:
    """Hourly time-series counts for charting. Defaults to last 24h."""
    t, f = resolve_window(to_date, from_date, dt.timedelta(hours=24))
    op_type_str = operation_type.value if operation_type else None
    rows = rollups.get_series(op_type=op_type_str, from_date=f, to_date=t)
    return CountSeriesResponse(
        operation_type=op_type_str or "all",
        date=DateRange.model_validate({"from": iso8601(f), "to": iso8601(t)}),
        points=[
            SeriesPoint(
                hour=r["hour"],
                op_type=r["op_type"],
                count=r["count"],
                shares=r.get("shares", 0.0),
            )
            for r in rows
        ],
    )


@router.get("/{operation_type}", response_model=CountResponse)
def count_ops_by_op_type(
    operation_type: OpType = OpType.witness_reward,
) -> CountResponse:
    return CountResponse(
        operations=rollups.get_count(op_type=operation_type.value),
        operation_type=operation_type.value,
        date="all",
    )


@router.get("/{to_date_str}/{period_in_seconds}", response_model=CountResponse)
def count_ops_in_period(
    to_date_str: str | None = None,
    period_in_seconds: int = 3600,
) -> CountResponse:
    to_date = dt.datetime.fromisoformat(to_date_str) if to_date_str else utcnow()
    from_date = to_date - dt.timedelta(seconds=period_in_seconds)
    return CountResponse(
        operations=rollups.get_count(from_date=from_date, to_date=to_date),
        operation_type="all",
        date=DateRange.model_validate({"from": iso8601(from_date), "to": iso8601(to_date)}),
    )


@router.get(
    "/{operation_type}/{to_date_str}/{period_in_seconds}",
    response_model=CountResponse,
)
def count_ops_by_op_type_in_period(
    operation_type: OpType = OpType.witness_reward,
    to_date_str: str | None = None,
    period_in_seconds: int = 3600,
) -> CountResponse:
    to_date = dt.datetime.fromisoformat(to_date_str) if to_date_str else utcnow()
    from_date = to_date - dt.timedelta(seconds=period_in_seconds)
    return CountResponse(
        operations=rollups.get_count(
            op_type=operation_type.value, from_date=from_date, to_date=to_date
        ),
        operation_type=operation_type.value,
        date=DateRange.model_validate({"from": iso8601(from_date), "to": iso8601(to_date)}),
    )
