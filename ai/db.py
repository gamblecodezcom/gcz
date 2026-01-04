import os
import time
import psycopg2
import psycopg2.extras
import psycopg2.pool
from typing import Optional, Any, Dict, List
from pathlib import Path

from ai_logger import get_logger
logger = get_logger("gcz-ai.db")

# ============================================================
# ENV LOADING (supports .env in project root)
# ============================================================

ROOT = Path(__file__).resolve().parents[1]
ENV_FILE = ROOT / ".env"

if ENV_FILE.exists():
    logger.info(f"Loading environment from {ENV_FILE}")
    for line in ENV_FILE.read_text().splitlines():
        if "=" in line and not line.strip().startswith("#"):
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip())

# ============================================================
# DATABASE URL RESOLUTION
# ============================================================

DB_URL = (
    os.getenv("GCZ_DB") or
    os.getenv("AI_AGENT_NEON_DB_URL") or
    os.getenv("DATABASE_URL")
)

if not DB_URL:
    logger.error(
        "❌ No database URL found. Expected one of: GCZ_DB, AI_AGENT_NEON_DB_URL, DATABASE_URL"
    )
    raise RuntimeError("No valid database URL found in environment variables")

logger.info(f"Using database URL source: {DB_URL[:40]}...")

# ============================================================
# CONNECTION POOL (AI + MCP + High‑load safe)
# ============================================================

_POOL: Optional[psycopg2.pool.SimpleConnectionPool] = None

def _init_pool(minconn: int = 1, maxconn: int = 5, retries: int = 5, delay: float = 1.0) -> None:
    """
    Initializes the connection pool with retry logic.
    Neon sometimes drops cold-start connections — this handles it.
    """
    global _POOL
    if _POOL is not None:
        return

    for attempt in range(1, retries + 1):
        try:
            logger.info(f"Initializing DB pool (attempt {attempt}/{retries})")
            _POOL = psycopg2.pool.SimpleConnectionPool(
                minconn=minconn,
                maxconn=maxconn,
                dsn=DB_URL,
                sslmode="require"
            )
            logger.info("DB pool initialized successfully")
            return
        except Exception as e:
            logger.error(f"DB pool init failed: {e}")
            time.sleep(delay)

    raise RuntimeError("Failed to initialize DB connection pool after retries")

def _get_pool() -> psycopg2.pool.SimpleConnectionPool:
    global _POOL
    if _POOL is None:
        _init_pool()
    return _POOL

# ============================================================
# RAW CONNECTION (legacy compatibility)
# ============================================================

def get_conn():
    """Legacy direct connection (no pooling)."""
    try:
        return psycopg2.connect(DB_URL, sslmode="require")
    except Exception as e:
        logger.error(f"Legacy DB connection failed: {e}")
        raise

# ============================================================
# POOLED CONNECTION HELPERS
# ============================================================

def get_pooled_conn():
    pool = _get_pool()
    try:
        return pool.getconn()
    except Exception as e:
        logger.error(f"Failed to get pooled connection: {e}")
        raise

def release_pooled_conn(conn):
    try:
        pool = _get_pool()
        pool.putconn(conn)
    except Exception as e:
        logger.error(f"Failed to release pooled connection: {e}")

# ============================================================
# INTERNAL EXECUTION WRAPPER
# ============================================================

def _execute(query: str, params: Optional[List[Any]], fetch: str):
    conn = get_pooled_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(query, params or ())
            if fetch == "one":
                result = cur.fetchone()
            elif fetch == "all":
                result = cur.fetchall()
            else:
                result = cur.fetchall() if cur.description else []
            conn.commit()
            return result
    except Exception as e:
        conn.rollback()
        logger.error(f"DB query failed: {e} | Query: {query} | Params: {params}")
        raise
    finally:
        release_pooled_conn(conn)

# ============================================================
# PUBLIC QUERY HELPERS
# ============================================================

def fetchone(query: str, params: Optional[List[Any]] = None) -> Optional[Dict[str, Any]]:
    return _execute(query, params, "one")

def fetchall(query: str, params: Optional[List[Any]] = None) -> List[Dict[str, Any]]:
    return _execute(query, params, "all")

def execute(query: str, params: Optional[List[Any]] = None) -> None:
    _execute(query, params, "none")

def run_query(query: str, params: Optional[List[Any]] = None):
    return _execute(query, params, "raw")

# ============================================================
# POOL SHUTDOWN
# ============================================================

def close_pool():
    global _POOL
    if _POOL:
        logger.info("Closing DB pool...")
        _POOL.closeall()
        _POOL = None