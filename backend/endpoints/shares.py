import datetime as dt

from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict, Field

from helpers import rollups
from helpers.dates import iso8601, utcnow
from helpers.enums import OpType

router = APIRouter(
    prefix="/shares",
    tags=["Shares"],
    responses={404: {"description": "Not found"}},
)


class DateRange(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    from_: str | None = Field(default=None, alias="from")
    to: str | None = None


class SharesResponse(BaseModel):
    shares: float
    operation_type: str
    date: DateRange | str


@router.get("/all", response_model=SharesResponse)
def sum_shares() -> SharesResponse:
    return SharesResponse(
        shares=rollups.get_shares_sum(),
        operation_type="all",
        date="all",
    )


@router.get("/{to_date_str}/{from_date_str}", response_model=SharesResponse)
def sum_shares_in_period(
    to_date_str: str | None = None,
    from_date_str: str | None = None,
) -> SharesResponse:
    to_date = dt.datetime.fromisoformat(to_date_str) if to_date_str else utcnow()
    from_date = (
        dt.datetime.fromisoformat(from_date_str)
        if from_date_str
        else to_date - dt.timedelta(hours=1)
    )
    return SharesResponse(
        shares=rollups.get_shares_sum(from_date=from_date, to_date=to_date),
        operation_type="all",
        date=DateRange.model_validate({"from": iso8601(from_date), "to": iso8601(to_date)}),
    )


@router.get(
    "/{operation_type}/{to_date_str}/{from_date_str}",
    response_model=SharesResponse,
)
def sum_shares_by_op_type_in_period(
    operation_type: OpType = OpType.witness_reward,
    to_date_str: str | None = None,
    from_date_str: str | None = None,
) -> SharesResponse:
    to_date = dt.datetime.fromisoformat(to_date_str) if to_date_str else utcnow()
    from_date = (
        dt.datetime.fromisoformat(from_date_str)
        if from_date_str
        else to_date - dt.timedelta(hours=1)
    )
    return SharesResponse(
        shares=rollups.get_shares_sum(
            op_type=operation_type.value, from_date=from_date, to_date=to_date
        ),
        operation_type=operation_type.value,
        date=DateRange.model_validate({"from": iso8601(from_date), "to": iso8601(to_date)}),
    )
