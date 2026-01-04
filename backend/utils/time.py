from datetime import datetime, timedelta

def utc_now():
    return datetime.utcnow()

def add_minutes(minutes: int):
    return datetime.utcnow() + timedelta(minutes=minutes)