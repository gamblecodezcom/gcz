from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class User(BaseModel):
    telegram_id: int
    username: Optional[str] = None
    created_at: datetime

    # Optional but supported across GCZ stack
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None

    # Profile integrations
    cwallet_id: Optional[str] = None
    runewager: Optional[str] = None
    winna: Optional[str] = None

    # Permissions / roles
    role: Optional[str] = None  # "user", "mod", "manager", "admin", "super_admin"

    # Feature flags
    hasRaffleAccess: Optional[bool] = None
    newsletterAgreed: Optional[bool] = None