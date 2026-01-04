# auth.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import jwt
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/auth", tags=["Auth"])

SECRET = "GCZ_AUTH_SECRET"
SUPER_ADMIN = 6668510825

class TelegramAuth(BaseModel):
    telegram_id: int
    username: str

@router.post("/login")
async def login(payload: TelegramAuth):
    token = jwt.encode({
        "telegram_id": payload.telegram_id,
        "username": payload.username,
        "exp": datetime.utcnow() + timedelta(days=7)
    }, SECRET, algorithm="HS256")

    return {
        "success": True,
        "token": token,
        "isAdmin": payload.telegram_id == SUPER_ADMIN
    }

@router.get("/validate")
async def validate(token: str):
    try:
        decoded = jwt.decode(token, SECRET, algorithms=["HS256"])
        return {"valid": True, "data": decoded}
    except:
        raise HTTPException(status_code=401, detail="Invalid token")