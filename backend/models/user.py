from pydantic import BaseModel
from datetime import datetime

class User(BaseModel):
    telegram_id: int
    username: str
    created_at: datetime