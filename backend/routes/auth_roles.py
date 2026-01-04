from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from services.db import get_db
from logger import get_logger

router = APIRouter(prefix="/auth", tags=["auth"])
logger = get_logger("gcz-auth-roles")

# Canonical role levels
ROLE_LEVELS = {
    "user": 0,
    "mod": 1,
    "manager": 2,
    "admin": 3,
    "super_admin": 4,
}

SUPER_ADMIN_TELEGRAM_ID = "6668510825"


class RoleResponse(BaseModel):
    telegram_id: str
    role: str
    level: int


# ============================================================
#  DB ROLE LOOKUP
# ============================================================

async def fetch_role_from_db(db, telegram_id: str):
    """
    Fetch role from telegram_roles table.
    Returns None if no entry exists.
    """
    try:
        row = await db.fetchrow(
            """
            SELECT role
            FROM telegram_roles
            WHERE telegram_id = $1
            LIMIT 1
            """,
            telegram_id,
        )
        return row["role"] if row else None

    except Exception as e:
        logger.error(f"[AUTH-ROLES] DB lookup failed for {telegram_id}: {e}")
        return None


# ============================================================
#  ROLE NORMALIZATION
# ============================================================

def normalize_role(role: str):
    if not role:
        return "user"

    role = role.lower().strip()

    # Aliases
    if role in ["mod", "moderator"]:
        return "mod"

    if role in ["manager", "mgr"]:
        return "manager"

    if role in ["admin", "administrator"]:
        return "admin"

    if role in ["superadmin", "super_admin", "owner", "root"]:
        return "super_admin"

    return "user"


# ============================================================
#  MAIN ROLE RESOLVER
# ============================================================

@router.get("/role/{telegram_id}", response_model=RoleResponse)
async def get_role(telegram_id: str, db=Depends(get_db)):
    """
    GCZ canonical role resolver.

    Supports:
    - Super admin override
    - DB-backed roles
    - Fallback to USER
    """

    telegram_id = telegram_id.strip()

    # SUPER ADMIN OVERRIDE
    if telegram_id == SUPER_ADMIN_TELEGRAM_ID:
        logger.info(f"[AUTH-ROLES] Super admin override for {telegram_id}")
        return RoleResponse(
            telegram_id=telegram_id,
            role="super_admin",
            level=ROLE_LEVELS["super_admin"],
        )

    # DB ROLE LOOKUP
    db_role = await fetch_role_from_db(db, telegram_id)
    normalized = normalize_role(db_role)

    logger.info(
        f"[AUTH-ROLES] Resolved role for {telegram_id}: "
        f"db_role={db_role} normalized={normalized}"
    )

    return RoleResponse(
        telegram_id=telegram_id,
        role=normalized,
        level=ROLE_LEVELS[normalized],
    )