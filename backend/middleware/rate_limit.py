import time
from fastapi import Request, HTTPException

RATE_LIMIT_WINDOW = 5
RATE_LIMIT_MAX = 20

requests_log = {}

async def rate_limiter(request: Request, call_next):
    ip = request.client.host
    now = time.time()

    if ip not in requests_log:
        requests_log[ip] = []

    requests_log[ip] = [t for t in requests_log[ip] if now - t < RATE_LIMIT_WINDOW]
    requests_log[ip].append(now)

    if len(requests_log[ip]) > RATE_LIMIT_MAX:
        raise HTTPException(status_code=429, detail="Too many requests")

    return await call_next(request)