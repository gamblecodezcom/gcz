import time
import threading

# Thread‑safe in‑memory cache
_cache = {}
_lock = threading.Lock()


def cache_set(key: str, value, ttl: int = 60):
    """
    Store a value with TTL (seconds).
    Overwrites safely and atomically.
    """
    expires = time.time() + ttl
    with _lock:
        _cache[key] = {"value": value, "expires": expires}


def cache_get(key: str):
    """
    Retrieve a cached value if not expired.
    Auto‑cleans expired entries.
    """
    with _lock:
        item = _cache.get(key)
        if not item:
            return None

        if time.time() > item["expires"]:
            del _cache[key]
            return None

        return item["value"]