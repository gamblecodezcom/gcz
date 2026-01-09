import asyncio
import json
import os
import subprocess
from typing import Any, Dict

import httpx
from backend.logger import get_logger

logger = get_logger("mistral")

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY", "")
MISTRAL_API_BASE = os.getenv("MISTRAL_API_BASE", "https://api.mistral.ai")
MISTRAL_MODEL = os.getenv("MISTRAL_MODEL", "mistral-large-2512")
MISTRAL_USE_SH = os.getenv("MISTRAL_USE_SH", "1") == "1"
MISTRAL_SH_PATH = os.getenv("MISTRAL_SH_PATH", "/var/www/html/gcz/mistral.sh")
MISTRAL_TIMEOUT_S = int(os.getenv("MISTRAL_TIMEOUT_S", "90"))


def _ensure_config():
    if not MISTRAL_API_KEY:
        raise RuntimeError("Mistral is not configured (MISTRAL_API_KEY missing).")


def _build_payload(prompt: str) -> Dict[str, Any]:
    return {
        "model": MISTRAL_MODEL,
        "inputs": [{"role": "user", "content": prompt}],
    }


def _mistral_via_script(prompt: str) -> Dict[str, Any]:
    _ensure_config()

    if not os.path.isfile(MISTRAL_SH_PATH):
        raise RuntimeError("mistral.sh not found.")

    try:
        result = subprocess.run(
            [MISTRAL_SH_PATH, prompt],
            capture_output=True,
            text=True,
            timeout=MISTRAL_TIMEOUT_S,
            env=os.environ.copy(),
            check=False,
        )
    except subprocess.TimeoutExpired:
        raise RuntimeError("mistral.sh timed out.")

    if result.returncode != 0:
        stderr = (result.stderr or "").strip()
        stdout = (result.stdout or "").strip()
        message = stderr or stdout or "mistral.sh failed."
        raise RuntimeError(message)

    output = (result.stdout or "").strip()
    if not output:
        raise RuntimeError("mistral.sh returned empty response.")

    try:
        return json.loads(output)
    except json.JSONDecodeError:
        return {"raw": output}


async def _mistral_via_http(prompt: str) -> Dict[str, Any]:
    _ensure_config()

    url = f"{MISTRAL_API_BASE.rstrip('/')}/v1/conversations"
    headers = {
        "Authorization": f"Bearer {MISTRAL_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = _build_payload(prompt)

    async with httpx.AsyncClient(timeout=MISTRAL_TIMEOUT_S) as client:
        response = await client.post(url, headers=headers, json=payload)
        response.raise_for_status()
        return response.json()


async def mistral_chat(prompt: str) -> Dict[str, Any]:
    if MISTRAL_USE_SH:
        return await asyncio.to_thread(_mistral_via_script, prompt)
    return await _mistral_via_http(prompt)
