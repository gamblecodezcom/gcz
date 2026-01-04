from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class RaffleEntry(BaseModel):
    """
    Canonical GCZ raffle entry model.

    Used by:
    - /api/sc/raffle/enter
    - Telegram bot (/enter)
    - Admin panel raffle viewer
    - SC balance engine
    - Analytics + logs
    """

    id: Optional[int] = None              # DB row ID (optional for creation)
    raffle_id: Optional[int] = None       # Which raffle this entry belongs to

    telegram_id: int                      # User entering the raffle
    username: Optional[str] = None        # Optional but extremely useful

    created_at: datetime                  # Timestamp of entry

    source: Optional[str] = "bot"         # "bot", "admin", "auto", "secret_code"
    sc_spent: Optional[int] = 1           # SC cost per entry (default 1)

    # Optional metadata for analytics
    ip: Optional[str] = None
    user_agent: Optional[str] = None