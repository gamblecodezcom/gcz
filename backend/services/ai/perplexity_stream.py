import os
import json
import asyncio
import httpx
from fastapi.responses import StreamingResponse

from logger import get_logger

logger = get_logger("perplexity-stream")

PPLX_API_KEY = os.getenv("PPLX_API_KEY")

if not PPLX_API_KEY:
    logger.warning("PPLX_API_KEY is not set — Perplexity streaming will fail")


# ============================================================
# STREAM PERPLEXITY RESPONSE (SSE)
# ============================================================
async def stream_perplexity(prompt: str):
    """
    Streams Perplexity AI responses token-by-token.
    Returns a FastAPI StreamingResponse generator.
    """

    async def event_generator():
        url = "https://api.perplexity.ai/chat/completions"

        headers = {
            "Authorization": f"Bearer {PPLX_API_KEY}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": "sonar-pro",
            "stream": True,
            "messages": [
                {"role": "system", "content": "You are GambleCodez AI."},
                {"role": "user", "content": prompt},
            ],
        }

        try:
            async with httpx.AsyncClient(timeout=None) as client:
                async with client.stream("POST", url, headers=headers, json=payload) as response:

                    async for line in response.aiter_lines():
                        if not line:
                            continue

                        if line.startswith("data: "):
                            data = line.replace("data: ", "").strip()

                            if data == "[DONE]":
                                yield "data: [DONE]\n\n"
                                break

                            try:
                                parsed = json.loads(data)
                                delta = parsed.get("choices", [{}])[0].get("delta", {})
                                token = delta.get("content")

                                if token:
                                    yield f"data: {json.dumps({'token': token})}\n\n"

                            except Exception as e:
                                logger.error(f"Perplexity stream parse error: {e}")
                                continue

                        await asyncio.sleep(0.01)

        except Exception as e:
            logger.error(f"Perplexity streaming error: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")