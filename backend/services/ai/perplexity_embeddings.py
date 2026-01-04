import os
import httpx
from backend.logger import get_logger

logger = get_logger("perplexity-embeddings")

PPLX_API_KEY = os.getenv("PPLX_API_KEY")

if not PPLX_API_KEY:
    logger.warning("PPLX_API_KEY is not set — Perplexity embeddings will fail")


async def perplexity_embed(text: str, model: str = "sonar-embed"):
    """
    Creates an embedding vector using Perplexity's embeddings API.
    Returns the embedding list or None on failure.
    """

    url = "https://api.perplexity.ai/embeddings"

    headers = {
        "Authorization": f"Bearer {PPLX_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": model,
        "input": text,
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()

            data = response.json()
            return data["data"][0]["embedding"]

    except Exception as e:
        logger.error(f"Perplexity embedding error: {e}")
        return None
