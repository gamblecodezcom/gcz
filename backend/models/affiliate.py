from pydantic import BaseModel
from typing import Optional


class Affiliate(BaseModel):
    """
    Canonical GambleCodez Affiliate model.

    Matches:
    - affiliates_master SQL table
    - master_affiliates.csv
    - Drops engine
    - Redirect engine
    - Admin panel
    - Site card rendering
    """

    # Core identity
    id: Optional[int] = None
    name: str
    slug: Optional[str] = None

    # Affiliate link
    affiliate_url: str

    # Categorization
    category: str                     # sweeps | crypto | lootbox | hybrid | faucet | instant
    status: str                       # active | disabled | hidden
    level: Optional[int] = None       # SweepsFlow level (1–5)

    # Visuals
    icon_url: Optional[str] = None
    resolved_domain: Optional[str] = None

    # Priority + ranking
    priority: int
    top_pick: Optional[bool] = False
    sort_order: Optional[int] = None

    # Bonus metadata
    bonus_code: Optional[str] = None
    bonus_description: Optional[str] = None

    # Redemption metadata
    redemption_speed: Optional[str] = None
    redemption_minimum: Optional[float] = None
    redemption_type: Optional[str] = None

    # Jurisdiction + flags
    jurisdiction: Optional[str] = None
    sc_allowed: Optional[bool] = True
    crypto_allowed: Optional[bool] = True
    cwallet_allowed: Optional[bool] = False
    lootbox_allowed: Optional[bool] = False
    show_in_profile: Optional[bool] = True

    # Admin metadata
    created_by: Optional[str] = None
    source: Optional[str] = None
    description: Optional[str] = None