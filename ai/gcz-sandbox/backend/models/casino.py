from pydantic import BaseModel
from typing import Optional


class Casino(BaseModel):
    """
    Canonical GambleCodez Casino model.

    Matches:
    - affiliates_master SQL table
    - master_affiliates.csv
    - Site card rendering
    - Redirect engine
    - Drops engine
    - Admin panel
    """

    # Core identity
    name: str
    slug: Optional[str] = None
    category: str                     # sweeps | crypto | lootbox | faucet | instant | hybrid
    status: str                       # active | disabled | hidden

    # Visuals
    icon_url: Optional[str] = None
    resolved_domain: Optional[str] = None

    # Priority + ranking
    priority: int
    level: Optional[int] = None       # SweepsFlow level (1–5)
    top_pick: Optional[bool] = False

    # Jurisdiction + type flags
    jurisdiction: Optional[str] = None    # us | non-us | both
    sc_allowed: Optional[bool] = True
    crypto_allowed: Optional[bool] = True
    cwallet_allowed: Optional[bool] = False
    lootbox_allowed: Optional[bool] = False
    show_in_profile: Optional[bool] = True

    # Redemption metadata
    redemption_speed: Optional[str] = None     # instant | same-day | 24h | 48h
    redemption_minimum: Optional[float] = None
    redemption_type: Optional[str] = None      # giftcard | crypto | bank | sweepstakes

    # Affiliate data
    affiliate_url: Optional[str] = None
    bonus_code: Optional[str] = None
    bonus_description: Optional[str] = None

    # Admin metadata
    source: Optional[str] = None
    created_by: Optional[str] = None
    sort_order: Optional[int] = None