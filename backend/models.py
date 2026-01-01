from pydantic import BaseModel
from typing import Optional

class PromoCode(BaseModel):
    id: str
    site: str
    code: str
    description: str
    createdAt: str
    expiresAt: Optional[str] = None
    verified: bool = True

class PromoLink(BaseModel):
    id: str
    site: str
    url: str
    description: str
    createdAt: str
    verified: bool = True