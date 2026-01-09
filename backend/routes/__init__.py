from .ai import router as ai_router
from .promos import router as promos_router
from .giveaway import router as giveaway_router
from .affiliates import router as affiliates_router
from .casinos import router as casinos_router
from .redeem import router as redeem_router
from .admin import router as admin_router
from .profile import router as profile_router
from .dashboard import router as dashboard_router
from .sc import router as sc_router
from .auth_roles import router as auth_roles_router
from .drops_intake import router as drops_intake_router
from .live_dashboard import router as live_dashboard_router

__all__ = [
    "ai_router",
    "promos_router",
    "giveaway_router",
    "affiliates_router",
    "casinos_router",
    "redeem_router",
    "admin_router",
    "profile_router",
    "dashboard_router",
    "sc_router",
    "auth_roles_router",
    "drops_intake_router",
    "live_dashboard_router",
]
