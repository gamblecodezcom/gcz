import time

_cache = {}

def cache_set(key: str, value, ttl: int = 60):
    _cache[key] = {
        "value": value,
        "expires": time.time() + ttl
    }

def cache_get(key: str):
    item = _cache.get(key)
    if not item:
        return None
    if time.time() > item["expires"]:
        del _cache[key]
        return None
    return item["value"]