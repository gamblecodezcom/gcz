from pydantic import BaseModel
from datetime import datetime

class Giveaway(BaseModel):
    id: str
    site: str
    winners: int
    prize_value: float
    end_time: datetime
    status: str