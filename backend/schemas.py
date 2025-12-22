"""
Pydantic schemas for request and response bodies.

These schemas enforce input validation and define the shape of data
returned by the API endpoints. They correspond closely to the SQLAlchemy
models in ``models.py`` but exclude internal fields like hashed passwords.
"""

from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    telegram_handle: Optional[str] = Field(None, max_length=100)
    cwallet_id: Optional[str] = Field(None, max_length=256)


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    confirm_password: str = Field(..., min_length=6)


class UserOut(UserBase):
    id: int
    created_at: datetime
    last_checkin_at: Optional[datetime]

    class Config:
        orm_mode = True


class WalletOut(BaseModel):
    balance: float
    updated_at: datetime

    class Config:
        orm_mode = True


class RaffleBase(BaseModel):
    name: str
    description: str
    prize: str
    start_time: datetime
    end_time: datetime


class RaffleCreate(RaffleBase):
    secret_password: str


class RaffleOut(RaffleBase):
    id: int
    is_active: bool
    winner_user_id: Optional[int]

    class Config:
        orm_mode = True


class RaffleEntryCreate(BaseModel):
    raffle_id: int
    secret_password: str


class RaffleEntryOut(BaseModel):
    id: int
    raffle_id: int
    user_id: int
    entry_time: datetime

    class Config:
        orm_mode = True


class NewsletterSubscriptionCreate(BaseModel):
    email: EmailStr


class NewsletterSubscriptionOut(BaseModel):
    id: int
    email: EmailStr
    subscribed_at: datetime

    class Config:
        orm_mode = True


class SiteReportCreate(BaseModel):
    site_name: str = Field(..., min_length=2, max_length=200)
    description: str = Field(..., min_length=10, max_length=1000)
    user_id: Optional[int]


class SiteReportOut(BaseModel):
    id: int
    site_name: str
    description: str
    user_id: Optional[int]
    created_at: datetime

    class Config:
        orm_mode = True


class RaffleWinnerOut(BaseModel):
    """Schema for a raffle winner and associated claim URL."""

    id: int
    raffle_id: int
    user_id: int
    claim_url: str
    created_at: datetime

    class Config:
        orm_mode = True


class RaffleUpdate(BaseModel):
    """Fields that can be updated on a raffle."""

    name: Optional[str] = None
    description: Optional[str] = None
    prize: Optional[str] = None
    secret_password: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    is_active: Optional[bool] = None


class RaffleWinnersAssign(BaseModel):
    """Payload for assigning winners to a raffle."""

    num_winners: int = Field(..., gt=0)
    claim_urls: List[str]