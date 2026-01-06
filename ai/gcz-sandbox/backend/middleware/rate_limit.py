import time
from fastapi import Request, HTTPException
from backend.logger import get_logger

logger = get_logger("gcz-rate-limit")

RATE_LIMIT_WINDOW = 5       # seconds
RATE_LIMIT_MAX = 20         # max requests per window

requests_log = {}


async def rate_limiter(request: Request, call_next):
    """
    Simple IP-based rate limiter.
    Allows RATE_LIMIT_MAX requests per RATE_LIMIT_WINDOW seconds.
    """
    ip = request.client.host
    now = time.monotonic()

    if ip not in requests_log:
        requests_log[ip] = []

    # Keep only timestamps inside the window
    requests_log[ip] = [t for t in requests_log[ip] if now - t < RATE_LIMIT_WINDOW]
    requests_log[ip].append(now)

    if len(requests_log[ip]) > RATE_LIMIT_MAX:
        logger.warning(f"[RATE_LIMIT] Too many requests from {ip}")
        raise HTTPException(status_code=429, detail="Too many requests")

    return await call_next(request)