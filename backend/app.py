"""
Main FastAPI application.

This module wires together the database, models, schemas and CRUD operations
into a REST API. Endpoints include user registration and login, wallet
operations, raffle management, newsletter subscriptions and site reports.
Authentication is implemented using JSON Web Tokens (JWT).
"""

import os
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from pydantic import BaseModel

from . import models, schemas, crud
from .database import engine, get_db

from sqlalchemy.orm import Session

# Create database tables
models.Base.metadata.create_all(bind=engine)

# FastAPI application
app = FastAPI(title="GambleCodez API", version="1.0.0")

# Enable CORS for all origins (adjust in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OAuth2 token URL for FastAPI
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/users/login")

# Secret key and algorithm for JWT
SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # token valid for 24 hours


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Generate a JWT token from the provided data and expiry."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> models.User:
    """Decode the JWT token and return the authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")  # subject is username
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = crud.get_user_by_username(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user


@app.post("/api/users/register", response_model=schemas.UserOut)
def register_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    """Register a new user with a unique username and email."""
    if crud.get_user_by_username(db, user_in.username):
        raise HTTPException(status_code=400, detail="Username already registered")
    if crud.get_user_by_email(db, user_in.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    try:
        user = crud.create_user(db, user_in)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    return user


@app.post("/api/users/login", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """Authenticate the user and return a JWT access token."""
    user = crud.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/api/users/me", response_model=schemas.UserOut)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    """Return information about the currently authenticated user."""
    return current_user


@app.get("/api/wallet", response_model=schemas.WalletOut)
def get_wallet_for_user(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return the wallet of the current user."""
    wallet = crud.get_wallet(db, current_user.id)
    if wallet is None:
        wallet = crud.credit_wallet(db, current_user.id, 0.0)
    return wallet


class WalletAction(BaseModel):
    amount: float


@app.post("/api/wallet/deposit", response_model=schemas.WalletOut)
def deposit(data: WalletAction, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Credit the user's wallet with a specified amount."""
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    wallet = crud.credit_wallet(db, current_user.id, data.amount)
    return wallet


@app.post("/api/wallet/withdraw", response_model=schemas.WalletOut)
def withdraw(data: WalletAction, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Debit the user's wallet by a specified amount."""
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    wallet = crud.debit_wallet(db, current_user.id, data.amount)
    if wallet is None:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    return wallet


@app.get("/api/raffles", response_model=List[schemas.RaffleOut])
def list_raffles(db: Session = Depends(get_db)):
    """List all currently active raffles."""
    return crud.list_active_raffles(db)


@app.post("/api/raffles", response_model=schemas.RaffleOut)
def create_raffle(raffle_in: schemas.RaffleCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a new raffle. In production, restrict to admin users."""
    # For now, allow any authenticated user to create a raffle
    return crud.create_raffle(db, raffle_in)


@app.post("/api/raffle_entries", response_model=schemas.RaffleEntryOut)
def enter_raffle(entry_in: schemas.RaffleEntryCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Enter an active raffle using the secret password."""
    entry = crud.enter_raffle(db, current_user.id, entry_in.raffle_id, entry_in.secret_password)
    if entry is None:
        raise HTTPException(status_code=400, detail="Unable to join raffle. Check ID, password, or raffle status.")
    return entry


@app.post("/api/newsletter", response_model=schemas.NewsletterSubscriptionOut)
def subscribe_newsletter(subscription_in: schemas.NewsletterSubscriptionCreate, db: Session = Depends(get_db)):
    """Subscribe an email address to the newsletter."""
    existing = db.query(models.NewsletterSubscription).filter(models.NewsletterSubscription.email == subscription_in.email).first()
    if existing:
        return existing
    return crud.create_newsletter_subscription(db, subscription_in)


@app.post("/api/site_reports", response_model=schemas.SiteReportOut)
def report_site(report_in: schemas.SiteReportCreate, token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Submit a report about a site. Anonymous users are allowed; if a valid token
    is provided, the report will be linked to the authenticated user."""
    user_id: Optional[int] = None
    # Attempt to decode token to get user
    if token:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            username: str = payload.get("sub")
            if username:
                user = crud.get_user_by_username(db, username)
                if user:
                    user_id = user.id
        except JWTError:
            # ignore invalid tokens for anonymous reporting
            pass
    report_in.user_id = user_id
    return crud.create_site_report(db, report_in)


@app.put("/api/raffles/{raffle_id}", response_model=schemas.RaffleOut)
def update_raffle(raffle_id: int, update_in: schemas.RaffleUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Edit an existing raffle's details. In a production environment this should be restricted to admin users."""
    raffle = crud.update_raffle(db, raffle_id, update_in)
    if raffle is None:
        raise HTTPException(status_code=404, detail="Raffle not found")
    return raffle


@app.post("/api/raffles/{raffle_id}/stop", response_model=schemas.RaffleOut)
def stop_raffle_endpoint(raffle_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Deactivate a raffle."""
    raffle = crud.stop_raffle(db, raffle_id)
    if raffle is None:
        raise HTTPException(status_code=404, detail="Raffle not found")
    return raffle


@app.post("/api/raffles/{raffle_id}/winners", response_model=List[schemas.RaffleWinnerOut])
def assign_raffle_winners_endpoint(raffle_id: int, assignment: schemas.RaffleWinnersAssign, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Select winners for a raffle and assign claim URLs."""
    try:
        winners = crud.assign_raffle_winners(db, raffle_id, assignment.num_winners, assignment.claim_urls)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    if winners is None:
        raise HTTPException(status_code=400, detail="Unable to assign winners. Not enough entries or invalid raffle.")
    return winners


@app.get("/api/raffles/{raffle_id}/winners", response_model=List[schemas.RaffleWinnerOut])
def list_raffle_winners(raffle_id: int, db: Session = Depends(get_db)):
    """List winners for a raffle."""
    raffle = crud.get_raffle(db, raffle_id)
    if raffle is None:
        raise HTTPException(status_code=404, detail="Raffle not found")
    return raffle.winners


@app.post("/api/users/checkin")
def daily_checkin(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Perform daily check-in for the current user to gain an extra entry or reward."""
    success = crud.check_in_user(db, current_user.id)
    if not success:
        raise HTTPException(status_code=400, detail="Already checked in today")
    return {"message": "Check-in successful"}

@app.get("/health")
def health_check():
    return {"status": "ok"}