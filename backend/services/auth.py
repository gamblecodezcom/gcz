from fastapi import HTTPException
from config import get_settings

settings = get_settings()

def require_admin(telegram_id: int):
    if telegram_id != settings.SUPER_ADMIN_ID:
        raise HTTPException(status_code=403, detail="Admin only")