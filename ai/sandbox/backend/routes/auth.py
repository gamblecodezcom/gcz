from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
import jwt

from config import get_settings
from backend.logger import get_logger

# God‑Mode auth service functions
from services.auth import (
    telegram_login,
    verify_session,
    get_role,
    verify_telegram_signature,
    get_role_for_user,
)

router = APIRouter(prefix="/api/auth", tags=["Auth"])
logger = get_logger("gcz-auth-router")

settings = get_settings()

SECRET = settings.JWT_SECRET
ISSUER = "GambleCodez"
TOKEN_LIFETIME_DAYS = 7


# ============================================================
#  TELEGRAM LOGIN BUTTON MODEL
# ============================================================

class TelegramAuth(BaseModel):
    telegram_id: int
    username: str


# ============================================================
#  TELEGRAM LOGIN BUTTON ENDPOINT
# ============================================================

@router.post("/telegram")
async def telegram_auth(request: Request):
    """
    Endpoint used by the Telegram Login Widget.
    Telegram sends a POST with:
        id, username, first_name, last_name, photo_url, auth_date, hash
    """
    form = await request.form()
    payload = {k: form[k] for k in form}

    # Verify Telegram signature
    if not verify_telegram_signature(payload):
        logger.warning(f"[AUTH] Telegram signature failed: {payload}")
        raise HTTPException(status_code=403, detail="Invalid Telegram login")

    telegram_id = int(payload["id"])
    username = payload.get("username")

    logger.info(f"[AUTH] Telegram login for {telegram_id} ({username})")

    # Create user + issue token
    return await telegram_login(telegram_id, username)


# ============================================================
#  LOGIN → RETURNS JWT + ROLE (Manual / API Login)
# ============================================================

@router.post("/login")
async def login(payload: TelegramAuth):
    """
    Issues a JWT for Telegram login.
    Uses DB-backed role system for admin/mod/manager.
    """
    if not payload.username or len(payload.username.strip()) < 2:
        raise HTTPException(status_code=400, detail="Invalid username")

    try:
        # Fetch role from DB (super_admin, admin, manager, mod, user)
        role = await get_role_for_user(payload.telegram_id)

        token = jwt.encode(
            {
                "telegram_id": payload.telegram_id,
                "username": payload.username,
                "role": role,
                "iss": ISSUER,
                "exp": datetime.utcnow() + timedelta(days=TOKEN_LIFETIME_DAYS),
            },
            SECRET,
            algorithm="HS256",
        )

        logger.info(
            f"[AUTH] Login: tg={payload.telegram_id} user={payload.username} role={role}"
        )

        return {
            "success": True,
            "token": token,
            "role": role,
            "isAdmin": role in ["admin", "super_admin"],
        }

    except Exception as e:
        logger.error(f"[AUTH] Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")


# ============================================================
#  VALIDATE JWT
# ============================================================

@router.get("/validate")
async def validate(token: str):
    """
    Validates JWT and returns decoded payload.
    """
    try:
        decoded = jwt.decode(
            token,
            SECRET,
            algorithms=["HS256"],
            issuer=ISSUER,
        )

        return {"valid": True, "data": decoded}

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")

    except jwt.InvalidIssuerError:
        raise HTTPException(status_code=401, detail="Invalid token issuer")

    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


# ============================================================
#  SESSION VALIDATION → /me
# ============================================================

@router.get("/me")
async def auth_me(request: Request):
    """
    Validates a JWT token and returns the user.
    Frontend must send:
        Authorization: Bearer <token>
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="Missing token")

    token = auth_header.replace("Bearer ", "").strip()
    return await verify_session(token)


# ============================================================
#  ROLE LOOKUP
# ============================================================

@router.get("/role/{telegram_id}")
async def auth_role(telegram_id: int):
    """
    Returns the user's role.
    Used by:
        - Admin panel
        - Telegram bot
        - Permissions system
    """
    role = await get_role(telegram_id)
    return {"telegram_id": telegram_id, "role": role}