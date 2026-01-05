import hashlib
import hmac
from datetime import datetime, timedelta
from fastapi import HTTPException
import jwt

from config import get_settings
from services.db import get_db
from backend.logger import get_logger
from backend.utils.auth import require_admin, fetch_user_role

logger = get_logger("gcz-auth-service")
settings = get_settings()

JWT_SECRET = settings.JWT_SECRET
JWT_EXPIRE_DAYS = int(getattr(settings, "JWT_EXPIRE_DAYS", 7))
TELEGRAM_BOT_TOKEN = getattr(settings, "TELEGRAM_BOT_TOKEN", None)
ISSUER = "GambleCodez"


def verify_telegram_signature(payload: dict) -> bool:
    """
    Verify Telegram login widget payload.
    https://core.telegram.org/widgets/login#checking-authorization
    """
    if not TELEGRAM_BOT_TOKEN or "hash" not in payload:
        return False

    data_check_list = []
    for key in sorted(payload.keys()):
        if key == "hash":
            continue
        value = payload.get(key)
        if value is None:
            continue
        data_check_list.append(f"{key}={value}")

    data_check_string = "\n".join(data_check_list)
    secret_key = hashlib.sha256(TELEGRAM_BOT_TOKEN.encode("utf-8")).digest()
    calculated_hash = hmac.new(secret_key, data_check_string.encode("utf-8"), hashlib.sha256).hexdigest()

    return hmac.compare_digest(calculated_hash, payload.get("hash", ""))


async def get_role_for_user(telegram_id: int) -> str:
    return await fetch_user_role(telegram_id)


async def get_role(telegram_id: int) -> str:
    return await fetch_user_role(telegram_id)


async def telegram_login(telegram_id: int, username: str | None = None):
    db = await get_db()
    tid = str(telegram_id)

    try:
        await db.execute(
            """
            INSERT INTO users (user_id, telegram_id, telegram_username, username, created_at, updated_at)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id) DO UPDATE SET
              telegram_id = EXCLUDED.telegram_id,
              telegram_username = COALESCE(EXCLUDED.telegram_username, users.telegram_username),
              username = COALESCE(EXCLUDED.username, users.username),
              updated_at = CURRENT_TIMESTAMP
            """,
            tid,
            tid,
            username,
            username,
        )

        role = await get_role_for_user(telegram_id)
        token = jwt.encode(
            {
                "telegram_id": telegram_id,
                "username": username,
                "role": role,
                "iss": ISSUER,
                "exp": datetime.utcnow() + timedelta(days=JWT_EXPIRE_DAYS),
            },
            JWT_SECRET,
            algorithm="HS256",
        )

        return {
            "success": True,
            "token": token,
            "role": role,
            "isAdmin": role in ["admin", "super_admin"],
        }

    except Exception as e:
        logger.error(f"[AUTH] Telegram login failed for {telegram_id}: {e}")
        raise HTTPException(status_code=500, detail="Telegram login failed")


async def verify_session(token: str):
    try:
        decoded = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=["HS256"],
            issuer=ISSUER,
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidIssuerError:
        raise HTTPException(status_code=401, detail="Invalid token issuer")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    telegram_id = decoded.get("telegram_id")
    if not telegram_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    db = await get_db()
    user = await db.fetchrow(
        """
        SELECT user_id, telegram_id, telegram_username, username, cwallet_id, email
        FROM users
        WHERE user_id = $1
        LIMIT 1
        """,
        str(telegram_id),
    )

    return {
        "valid": True,
        "data": decoded,
        "user": dict(user) if user else None,
    }


__all__ = [
    "require_admin",
    "telegram_login",
    "verify_session",
    "get_role",
    "verify_telegram_signature",
    "get_role_for_user",
]
