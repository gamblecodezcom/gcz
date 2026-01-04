from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from gcz.backend.db import get_db

router = APIRouter(prefix="/auth", tags=["auth"])

# Canonical role levels
ROLE_LEVELS = {
    "user": 0,
    "mod": 1,
    "manager": 2,
    "admin": 3,
    "super_admin": 4
}

SUPER_ADMIN_TELEGRAM_ID = "6668510825"


class RoleResponse(BaseModel):
    telegram_id: str
    role: str
    level: int


async def fetch_role_from_db(db, telegram_id: str):
    """
    Optional DB lookup.
    If you later add a table like telegram_roles, this will fetch it.
    For now, returns None (fallback to USER).
    """
    row = await db.fetchrow("""
        SELECT role FROM telegram_roles
        WHERE telegram_id = $1
        LIMIT 1
    """, telegram_id)

    if row:
        return row["role"]

    return None


def normalize_role(role: str):
    if not role:
        return "user"

    role = role.lower().strip()

    if role in ["mod", "moderator"]:
        return "mod"

    if role == "manager":
        return "manager"

    if role == "admin":
        return "admin"

    if role in ["superadmin", "super_admin"]:
        return "super_admin"

    return "user"


@router.get("/role/{telegram_id}", response_model=RoleResponse)
async def get_role(telegram_id: str, db=Depends(get_db)):
    """
    Main role resolver for the GCZ bot.
    Supports:
    - Super admin override
    - DB-backed roles
    - Fallback to USER
    """

    # Super admin override
    if telegram_id == SUPER_ADMIN_TELEGRAM_ID:
        return RoleResponse(
            telegram_id=telegram_id,
            role="super_admin",
            level=ROLE_LEVELS["super_admin"]
        )

    # Try DB lookup
    db_role = await fetch_role_from_db(db, telegram_id)
    normalized = normalize_role(db_role)

    return RoleResponse(
        telegram_id=telegram_id,
        role=normalized,
        level=ROLE_LEVELS[normalized]
    )