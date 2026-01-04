from fastapi import Request, HTTPException
from config import get_settings
import jwt

settings = get_settings()

async def auth_guard(request: Request, call_next):
    token = request.headers.get("Authorization")
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")

    try:
        jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

    return await call_next(request)