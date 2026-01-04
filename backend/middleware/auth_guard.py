from fastapi import Request, HTTPException
from config import get_settings
from logger import get_logger
import jwt

settings = get_settings()
logger = get_logger("gcz-auth-guard")


async def auth_guard(request: Request, call_next):
    """
    Global JWT authentication middleware.
    Expects:
        Authorization: Bearer <token>
    """
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        raise HTTPException(status_code=401, detail="Missing token")

    # Support "Bearer <token>"
    token = auth_header.replace("Bearer ", "").strip()

    try:
        jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
    except jwt.ExpiredSignatureError:
        logger.warning("[AUTH_GUARD] Token expired")
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception as e:
        logger.warning(f"[AUTH_GUARD] Invalid token: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")

    return await call_next(request)