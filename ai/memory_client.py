import os
import requests
from requests.exceptions import RequestException, Timeout

class MemoryClient:
    def __init__(self, base="http://127.0.0.1:8010", timeout=5, retries=2):
        self.base = base.rstrip("/")
        self.timeout = timeout
        self.retries = retries
        self.key = os.getenv("GCZ_CONTROL_KEY")

    # --------------------------------------------------------
    # INTERNAL REQUEST WRAPPER
    # --------------------------------------------------------
    def _request(self, method, path, **kwargs):
        url = f"{self.base}{path}"
        headers = kwargs.pop("headers", {}) or {}
        if self.key:
            headers["x-gcz-key"] = self.key
        if headers:
            kwargs["headers"] = headers

        for attempt in range(1, self.retries + 1):
            try:
                response = requests.request(
                    method,
                    url,
                    timeout=self.timeout,
                    **kwargs
                )
                return response.json()
            except Timeout:
                if attempt == self.retries:
                    return {"error": "timeout", "url": url}
            except RequestException as e:
                if attempt == self.retries:
                    return {"error": str(e), "url": url}

        return {"error": "unknown"}

    # --------------------------------------------------------
    # MEMORY (DB-backed)
    # --------------------------------------------------------
    def add(self, category, message, source="cli", meta=None):
        payload = {
            "category": category,
            "message": message,
            "source": source,
            "meta": meta or {}
        }
        return self._request("POST", "/memory", json=payload)

    def list(self, limit=200):
        return self._request("GET", f"/memory?limit={limit}")

    # --------------------------------------------------------
    # HEALTH ENGINE
    # --------------------------------------------------------
    def health(self):
        return self._request("GET", "/health")

    def anomalies(self):
        return self._request("GET", "/anomalies")

    def scan(self):
        return self._request("POST", "/scan", json={})
