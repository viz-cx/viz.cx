import datetime as dt


def parse_date_string(date_string: str) -> dt.datetime:
    try:
        return dt.datetime.strptime(date_string, "%Y-%m-%dT%H:%M:%S.%f%z")
    except ValueError:
        return dt.datetime.strptime(date_string, "%Y-%m-%dT%H:%M:%S%z")


def iso8601(date: dt.datetime) -> str:
    return date.strftime("%Y-%m-%dT%H:%M:%SZ")


def utcnow() -> dt.datetime:
    """Timezone-aware current UTC time."""
    return dt.datetime.now(dt.UTC)


def resolve_window(
    to_date: str | None, from_date: str | None, default_span: dt.timedelta
) -> tuple[dt.datetime, dt.datetime]:
    """Resolve to/from query params into a concrete UTC window.

    Defaults to (now - default_span, now) when callers omit the parameters.
    Avoids the bug of evaluating now() at module import time.
    """
    now = utcnow()
    to = parse_date_string(to_date) if to_date else now
    fr = parse_date_string(from_date) if from_date else now - default_span
    return to, fr
