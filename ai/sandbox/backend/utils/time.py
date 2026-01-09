from datetime import datetime, timedelta, timezone


def utc_now() -> datetime:
    """
    Returns a timezone-aware UTC datetime.
    Matches Neon TIMESTAMPTZ expectations.
    """
    return datetime.now(timezone.utc)


def add_minutes(minutes: int) -> datetime:
    """
    Returns utc_now() + N minutes.
    """
    return utc_now() + timedelta(minutes=minutes)


def add_hours(hours: int) -> datetime:
    """
    Convenience helper: utc_now() + N hours.
    """
    return utc_now() + timedelta(hours=hours)


def add_days(days: int) -> datetime:
    """
    Convenience helper: utc_now() + N days.
    """
    return utc_now() + timedelta(days=days)


def seconds_from_now(seconds: int) -> datetime:
    """
    Returns utc_now() + N seconds.
    Useful for cooldowns, rate limits, and expiring tokens.
    """
    return utc_now() + timedelta(seconds=seconds)