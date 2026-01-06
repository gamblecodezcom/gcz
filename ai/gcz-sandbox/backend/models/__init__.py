# This file makes the models directory a Python package.
# Enables imports like:
#   from models import User, Giveaway, PromoCode, PromoLink

from .user import User
from .giveaway import Giveaway
from .raffle import RaffleEntry
from .affiliate import Affiliate
from .casino import Casino
from .promo import PromoCode, PromoLink, PromoUnion

__all__ = [
    "User",
    "Giveaway",
    "RaffleEntry",
    "Affiliate",
    "Casino",
    "PromoCode",
    "PromoLink",
    "PromoUnion",
]