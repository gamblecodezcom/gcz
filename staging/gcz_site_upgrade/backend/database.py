"""
Database connection and session management using SQLAlchemy.

This module sets up the SQLAlchemy engine and session for interacting with
a SQLite database. The connection string is loaded from environment variables
or defaults to a local SQLite file (``sqlite:///gcz.db``) in the current
directory. A helper function ``get_db`` is provided to yield a session
instance for dependency injection in FastAPI routes.
"""

import os
from contextlib import contextmanager
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./gcz.db")

# echo=True prints all SQL statements for debugging; set to False in production
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}, echo=False
)

# Each instance of SessionLocal is a database session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@contextmanager
def get_db() -> Session:
    """Yield a SQLAlchemy database session and ensure it's closed after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()