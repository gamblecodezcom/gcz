from pydantic import BaseModel

class Affiliate(BaseModel):
    name: str
    affiliate_url: str
    priority: int
    category: str
    status: str
    level: str
    bonus_code: str
    bonus_description: str
    icon_url: str
    redemption_speed: str
    redemption_minimum: int
    redemption_type: str