from pydantic import BaseModel
from datetime import datetime

class RaffleEntry(BaseModel):
    telegram_id: int
    created_at: datetime