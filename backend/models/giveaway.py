from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class Giveaway(BaseModel):
    """
    Canonical GCZ Giveaway model.

    Used by:
    - Telegram bot (/start_giveaway, /enter, /pick_winners)
    - Admin panel
    - Winner selection engine
    - Claim URL assignment
    - Endless raffle mode
    """

    id: str                           # UUID or DB ID
    site: str                         # runewager | winna | cwallet
    winners: int                      # number of winners to pick
    prize_value: float                # SC or crypto value
    end_time: datetime                # when entries close
    status: str                       # pending | active | ended | paid

    # Optional but used across GCZ stack
    created_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None

    # Claim URLs (one per winner)
    claim_urls: Optional[List[str]] = None

    # Endless raffle mode
    endless: Optional[bool] = False

    # Admin metadata
    created_by: Optional[int] = None          # telegram_id of admin
    notes: Optional[str] = None               # internal notes