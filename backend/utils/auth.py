"""
utils/auth.py

Centralized permission enforcement for GambleCodez backend.

Supports:
- SUPER_ADMIN_ID from .env
- Multiple admin IDs (optional)
- DB-backed role system via auth_roles table
- Clean HTTPException handling
- Logging for denied access
"""

from fastapi import HTTPException
from config import get_settings
from logger import get_logger
from services.db import get_db

settings = get_settings()
logger = get_logger("permissions")

# Normalize env values
SUPER_ADMIN_ID = str(settings.SUPER_ADMIN_ID).strip()

# Optional: comma-separated admin list
ADMIN_IDS = set(
    str(x).strip()
    for x in getattr(settings, "ADMIN_TELEGRAM_IDS", "").split(",")
    if x.strip()
)

# Canonical role hierarchy
ROLE_LEVELS = {
    "user": 0,
    "mod": 1,
    "manager": 2,
    "admin": 3,
    "super_admin": 4,
}


# ============================================================
#  DB ROLE FETCHER
# ============================================================

async def fetch_user_role(telegram_id: int) -> str:
    """
    Fetches the user's role from the DB via auth_roles table.
    Falls back to 'user' if not found.
    """
    try:
        db = await get_db()
        row = await db.fetchrow(
            "SELECT role FROM auth_roles WHERE telegram_id = $1",
            telegram_id
        )
        return row["role"] if row else "user"

    except Exception as e:
        logger.error(f"[PERMISSIONS] Failed to fetch role for {telegram_id}: {e}")
        return "user"


# ============================================================
#  ADMIN ENFORCEMENT
# ============================================================

async def require_admin(telegram_id: int, role: str = None):
    """
    Enforces admin-level access.

    Rules:
        - SUPER_ADMIN_ID always passes
        - ADMIN_IDS (optional env list) pass
        - DB role must meet or exceed required level
        - If no role is specified, require admin or super_admin
    """

    tid = str(telegram_id)

    # SUPER ADMIN OVERRIDE
    if tid == SUPER_ADMIN_ID:
        return True

    # ENV-BASED ADMIN LIST
    if tid in ADMIN_IDS:
        return True

    # Fetch DB-backed role
    user_role = await fetch_user_role(telegram_id)
    user_level = ROLE_LEVELS.get(user_role, 0)

    # If a specific role is required (mod, manager, admin, super_admin)
    if role:
        required_level = ROLE_LEVELS.get(role, 999)
        if user_level >= required_level:
            return True

    # Default: require admin or super_admin
    if user_level >= ROLE_LEVELS["admin"]:
        return True

    # FAIL — log and deny
    logger.warning(
        f"[PERMISSIONS] DENIED → telegram_id={telegram_id} "
        f"(role={user_role}, required={role})"
    )
    raise HTTPException(status_code=403, detail="Admin only")