import datetime


def parse_date_string(date_string: str) -> datetime.datetime:
    try:
        return datetime.datetime.strptime(
            date_string, "%Y-%m-%dT%H:%M:%S.%f%z"
        )
    except ValueError:
        return datetime.datetime.strptime(date_string, "%Y-%m-%dT%H:%M:%S%z")


def iso8601(date: datetime.datetime) -> str:
    return date.strftime("%Y-%m-%dT%H:%M:%SZ")
