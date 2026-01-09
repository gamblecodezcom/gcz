"""
backend/models/promo.py

Canonical GambleCodez promo models.

These models define the shape of promos as they move through:
- Discord SC Codes channel (noisy human conversation)
- AI extraction + formatting
- Backend validation + storage
- Drops dashboard
- Telegram forwarder

CRITICAL RULES:
- Promos are ONLY PromoCode or PromoLink.
- Promo links are NEVER modified (no redirect, no shortening, no tracking injection).
- Affiliate links are handled separately and NEVER replace promo URLs.
- AI formats the promo text, but the URL stays EXACTLY as posted.
"""

from pydantic import BaseModel
from typing import Optional, Literal, Union


# ============================================================
# BASE MODEL
# ============================================================

class PromoBase(BaseModel):
    """
    Shared fields for all promos.

    id:
        Internal or external identifier (DB row ID, hash, or AI-generated ID).
    site:
        Casino or platform name ("Wow Vegas", "Stake.us", etc.).
    description:
        Cleaned summary of the promo extracted from noisy Discord chat.
    created_at:
        Timestamp string; backend normalizes to datetime.
    verified:
        Whether the promo passed validation (AI + backend).
    active:
        Whether the promo is currently active in the GCZ system.
    """
    id: str
    site: str
    description: str
    created_at: str
    verified: bool = True
    active: bool = True


# ============================================================
# PROMO CODE
# ============================================================

class PromoCode(PromoBase):
    """
    A promo that contains a redeemable code.

    Examples:
        "Use code WOWFREE for 1SC"
        "Stake.us bonus code FREE5"

    Fields:
        type: Always "code".
        code: The redeemable code.
        expires_at: Optional expiry timestamp.
    """
    type: Literal["code"] = "code"
    code: str
    expires_at: Optional[str] = None


# ============================================================
# PROMO LINK
# ============================================================

class PromoLink(PromoBase):
    """
    A promo that contains a URL.

    Examples:
        Google Form for Wow Vegas 1SC drop
        Gleam.io giveaway
        Typeform claim page
        Casino promo page

    CRITICAL:
        The URL must be stored EXACTLY as posted.
        - No rewriting
        - No redirecting
        - No affiliate injection
        - No normalization
        - No shortening

    Affiliate links are handled separately and NEVER modify this URL.
    """
    type: Literal["link"] = "link"
    url: str


# ============================================================
# UNION
# ============================================================

PromoUnion = Union[PromoCode, PromoLink]
"""
PromoUnion is used anywhere the backend or AI pipeline needs to accept
or return "either a promo code or a promo link" without caring which one.

Typical usage:
- FastAPI request/response models
- AI extraction results
- Internal service functions that operate on generic promos
"""