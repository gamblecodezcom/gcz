import os
import httpx
import json
from backend.logger import get_logger

logger = get_logger("perplexity-search")

PPLX_API_KEY = os.getenv("PPLX_API_KEY")

if not PPLX_API_KEY:
    logger.warning("PPLX_API_KEY is not set — Perplexity search will fail")


async def perplexity_search(query: str) -> str:
    """
    Performs a non-streaming Perplexity search using sonar-pro.
    Returns the final text response.
    """

    url = "https://api.perplexity.ai/chat/completions"

    headers = {
        "Authorization": f"Bearer {PPLX_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "sonar-pro",
        "messages": [
            {"role": "system", "content": "Use web search to answer accurately."},
            {"role": "user", "content": query},
        ],
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()

            data = response.json()
            return data["choices"][0]["message"]["content"]

    except Exception as e:
        logger.error(f"Perplexity search error: {e}")
        return "Error: Perplexity search failed"
