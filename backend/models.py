"""
SQLAlchemy models defining the application's database schema.

This module declares ORM classes for users, wallets, raffles, raffle entries,
newsletter subscriptions, and site reports. Relationships are set up where
appropriate to simplify querying. Use ``Base.metadata.create_all(engine)``
to create the tables after importing this module.
"""

from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Boolean,
    Float,
    UniqueConstraint,
)
from sqlalchemy.orm import declarative_base, relationship


# Base class for our models
Base = declarative_base()


class User(Base):
    """Represents a registered user in the system."""

    __tablename__ = "users"

    id: int = Column(Integer, primary_key=True, index=True)
    username: str = Column(String(50), unique=True, index=True, nullable=False)
    email: str = Column(String(256), unique=True, index=True, nullable=False)
    hashed_password: str = Column(String(256), nullable=False)
    telegram_handle: str = Column(String(100), nullable=True)
    cwallet_id: str = Column(String(256), nullable=True)
    last_checkin_at: datetime = Column(DateTime, nullable=True)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)

    wallet = relationship("Wallet", back_populates="user", uselist=False)
    raffle_entries = relationship("RaffleEntry", back_populates="user")
    site_reports = relationship("SiteReport", back_populates="user")
    raffle_wins = relationship("RaffleWinner", back_populates="user")


class Wallet(Base):
    """Represents a user's cwallet for storing virtual coins or points."""

    __tablename__ = "wallets"

    id: int = Column(Integer, primary_key=True, index=True)
    user_id: int = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    balance: float = Column(Float, default=0.0)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="wallet")


class Raffle(Base):
    """Represents a raffle event users can enter to win prizes."""

    __tablename__ = "raffles"

    id: int = Column(Integer, primary_key=True, index=True)
    name: str = Column(String(100), nullable=False)
    description: str = Column(String(500), nullable=False)
    prize: str = Column(String(200), nullable=False)
    secret_password: str = Column(String(256), nullable=False)
    start_time: datetime = Column(DateTime, nullable=False)
    end_time: datetime = Column(DateTime, nullable=False)
    winner_user_id: Optional[int] = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_active: bool = Column(Boolean, default=True)

    # The user who won the raffle (if any)
    winner = relationship("User", foreign_keys=[winner_user_id])
    entries = relationship("RaffleEntry", back_populates="raffle")
    winners = relationship("RaffleWinner", back_populates="raffle")


class RaffleEntry(Base):
    """Represents a single entry into a raffle by a user."""

    __tablename__ = "raffle_entries"

    id: int = Column(Integer, primary_key=True, index=True)
    raffle_id: int = Column(Integer, ForeignKey("raffles.id"), nullable=False)
    user_id: int = Column(Integer, ForeignKey("users.id"), nullable=False)
    entry_time: datetime = Column(DateTime, default=datetime.utcnow)

    raffle = relationship("Raffle", back_populates="entries")
    user = relationship("User", back_populates="raffle_entries")

    __table_args__ = (UniqueConstraint("raffle_id", "user_id", name="unique_raffle_user"),)


class NewsletterSubscription(Base):
    """Represents a newsletter subscription entry (email address)."""

    __tablename__ = "newsletter_subscriptions"

    id: int = Column(Integer, primary_key=True, index=True)
    email: str = Column(String(256), unique=True, index=True, nullable=False)
    subscribed_at: datetime = Column(DateTime, default=datetime.utcnow)


class SiteReport(Base):
    """Represents a report submitted by a user about a particular site."""

    __tablename__ = "site_reports"

    id: int = Column(Integer, primary_key=True, index=True)
    user_id: int = Column(Integer, ForeignKey("users.id"), nullable=True)
    site_name: str = Column(String(200), nullable=False)
    description: str = Column(String(1000), nullable=False)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="site_reports")


class RaffleWinner(Base):
    """Represents a winning user for a particular raffle with an associated claim URL."""

    __tablename__ = "raffle_winners"

    id: int = Column(Integer, primary_key=True, index=True)
    raffle_id: int = Column(Integer, ForeignKey("raffles.id"), nullable=False)
    user_id: int = Column(Integer, ForeignKey("users.id"), nullable=False)
    claim_url: str = Column(String(500), nullable=False)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)

    raffle = relationship("Raffle", back_populates="winners")
    user = relationship("User", back_populates="raffle_wins")