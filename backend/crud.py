"""
CRUD (Create, Read, Update, Delete) utility functions.

These functions encapsulate database interactions using SQLAlchemy sessions.
They are called from the API routes defined in ``app.py``.
"""

from datetime import datetime
from typing import Optional, List

from sqlalchemy.orm import Session
from sqlalchemy.exc import NoResultFound, IntegrityError
from passlib.context import CryptContext

from . import models, schemas


# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_user_by_username(db: Session, username: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.username == username).first()


def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, user_in: schemas.UserCreate) -> models.User:
    """Create a new user with hashed password and optional social fields."""
    # Ensure password confirmation matches
    if user_in.password != user_in.confirm_password:
        raise ValueError("Passwords do not match")
    hashed_password = get_password_hash(user_in.password)
    db_user = models.User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hashed_password,
        telegram_handle=user_in.telegram_handle,
        cwallet_id=user_in.cwallet_id,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    # Create wallet with zero balance
    wallet = models.Wallet(user_id=db_user.id, balance=0.0)
    db.add(wallet)
    db.commit()
    db.refresh(wallet)
    return db_user


def authenticate_user(db: Session, username: str, password: str) -> Optional[models.User]:
    user = get_user_by_username(db, username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def get_wallet(db: Session, user_id: int) -> Optional[models.Wallet]:
    return db.query(models.Wallet).filter(models.Wallet.user_id == user_id).first()


def credit_wallet(db: Session, user_id: int, amount: float) -> models.Wallet:
    wallet = get_wallet(db, user_id)
    if wallet is None:
        wallet = models.Wallet(user_id=user_id, balance=0.0)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    wallet.balance += amount
    db.commit()
    db.refresh(wallet)
    return wallet


def debit_wallet(db: Session, user_id: int, amount: float) -> Optional[models.Wallet]:
    wallet = get_wallet(db, user_id)
    if wallet is None or wallet.balance < amount:
        return None
    wallet.balance -= amount
    db.commit()
    db.refresh(wallet)
    return wallet


def create_raffle(db: Session, raffle_in: schemas.RaffleCreate) -> models.Raffle:
    raffle = models.Raffle(
        name=raffle_in.name,
        description=raffle_in.description,
        prize=raffle_in.prize,
        secret_password=raffle_in.secret_password,
        start_time=raffle_in.start_time,
        end_time=raffle_in.end_time,
        is_active=True,
    )
    db.add(raffle)
    db.commit()
    db.refresh(raffle)
    return raffle


def list_active_raffles(db: Session) -> List[models.Raffle]:
    now = datetime.utcnow()
    return (
        db.query(models.Raffle)
        .filter(models.Raffle.start_time <= now, models.Raffle.end_time >= now, models.Raffle.is_active == True)
        .all()
    )


def get_raffle(db: Session, raffle_id: int) -> Optional[models.Raffle]:
    return db.query(models.Raffle).filter(models.Raffle.id == raffle_id).first()


def enter_raffle(db: Session, user_id: int, raffle_id: int, secret_password: str) -> Optional[models.RaffleEntry]:
    raffle = get_raffle(db, raffle_id)
    if raffle is None:
        return None
    if raffle.secret_password != secret_password:
        return None
    # ensure raffle is active and within time window
    now = datetime.utcnow()
    if not (raffle.start_time <= now <= raffle.end_time and raffle.is_active):
        return None
    # ensure user has subscribed to newsletter
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return None
    subscribed = db.query(models.NewsletterSubscription).filter(models.NewsletterSubscription.email == user.email).first()
    if subscribed is None:
        return None
    # check if user already entered
    existing = (
        db.query(models.RaffleEntry)
        .filter(models.RaffleEntry.raffle_id == raffle_id, models.RaffleEntry.user_id == user_id)
        .first()
    )
    if existing:
        return existing
    # create entry
    entry = models.RaffleEntry(raffle_id=raffle_id, user_id=user_id)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def update_raffle(db: Session, raffle_id: int, update_data: schemas.RaffleUpdate) -> Optional[models.Raffle]:
    """Update an existing raffle with provided fields."""
    raffle = get_raffle(db, raffle_id)
    if raffle is None:
        return None
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(raffle, field, value)
    db.commit()
    db.refresh(raffle)
    return raffle


def stop_raffle(db: Session, raffle_id: int) -> Optional[models.Raffle]:
    """Deactivate a raffle, preventing further entries."""
    raffle = get_raffle(db, raffle_id)
    if raffle is None:
        return None
    raffle.is_active = False
    db.commit()
    db.refresh(raffle)
    return raffle


def assign_raffle_winners(db: Session, raffle_id: int, num_winners: int, claim_urls: List[str]) -> Optional[List[models.RaffleWinner]]:
    """Randomly select winners from raffle entries and assign claim URLs."""
    raffle = get_raffle(db, raffle_id)
    if raffle is None:
        return None
    # fetch all entries for raffle
    entries = db.query(models.RaffleEntry).filter(models.RaffleEntry.raffle_id == raffle_id).all()
    if not entries or len(entries) < num_winners:
        return None
    import random

    winners = random.sample(entries, num_winners)
    if len(claim_urls) < num_winners:
        raise ValueError("Not enough claim URLs provided")
    winner_objects: List[models.RaffleWinner] = []
    for entry, url in zip(winners, claim_urls):
        winner = models.RaffleWinner(raffle_id=raffle_id, user_id=entry.user_id, claim_url=url)
        db.add(winner)
        winner_objects.append(winner)
    # mark raffle inactive after winners selected
    raffle.is_active = False
    db.commit()
    for obj in winner_objects:
        db.refresh(obj)
    db.refresh(raffle)
    return winner_objects


def check_in_user(db: Session, user_id: int) -> bool:
    """Record a daily check-in for a user. Returns True if successful, False if already checked today."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        return False
    now = datetime.utcnow()
    if user.last_checkin_at is not None:
        # If same date, do not allow multiple check-ins
        last_date = user.last_checkin_at.date()
        if last_date == now.date():
            return False
    user.last_checkin_at = now
    # For demonstration, credit 0.1 coins for daily check-in
    wallet = get_wallet(db, user_id)
    if wallet:
        wallet.balance += 0.1
    db.commit()
    return True


def create_newsletter_subscription(db: Session, subscription_in: schemas.NewsletterSubscriptionCreate) -> models.NewsletterSubscription:
    subscription = models.NewsletterSubscription(email=subscription_in.email)
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    return subscription


def create_site_report(db: Session, report_in: schemas.SiteReportCreate) -> models.SiteReport:
    report = models.SiteReport(
        site_name=report_in.site_name,
        description=report_in.description,
        user_id=report_in.user_id,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report