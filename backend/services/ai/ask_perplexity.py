import os
import httpx
from logger import get_logger

logger = get_logger("perplexity-ask")

PPLX_API_KEY = os.getenv("PPLX_API_KEY")

if not PPLX_API_KEY:
    logger.warning("PPLX_API_KEY is not set — ask_perplexity will fail")


async def ask_perplexity(prompt: str, model: str = "sonar-pro") -> str:
    """
    Sends a single-turn prompt to Perplexity using the chat/completions API.
    Returns the final text response.
    """

    url = "https://api.perplexity.ai/chat/completions"

    headers = {
        "Authorization": f"Bearer {PPLX_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": model,
        "messages": [
            {"role": "user", "content": prompt}
        ],
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()

            data = response.json()
            return data["choices"][0]["message"]["content"]

    except Exception as e:
        logger.error(f"ask_perplexity error: {e}")
        return "Error: Perplexity request failed"