from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from logger import get_logger

# Async Perplexity client
from services.ai import (
    ask_perplexity,
    stream_perplexity,
    perplexity_search,
    perplexity_embed,
)

router = APIRouter(prefix="/api/ai", tags=["AI"])
logger = get_logger("gcz-ai")


# ============================================================
#  REQUEST MODEL
# ============================================================

class PerplexityRequest(BaseModel):
    prompt: str


# ============================================================
#  /perplexity  (chat completion)
# ============================================================

@router.post("/perplexity")
async def ai_perplexity(payload: PerplexityRequest):
    prompt = payload.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    try:
        logger.info(f"[AI] /perplexity: {prompt[:80]}...")
        answer = await ask_perplexity(prompt)
        return {"answer": answer}

    except Exception as e:
        logger.error(f"[AI] /perplexity error: {e}")
        raise HTTPException(status_code=500, detail="AI processing error")


# ============================================================
#  /perplexity-search  (search-augmented)
# ============================================================

@router.post("/perplexity-search")
async def ai_perplexity_search(payload: PerplexityRequest):
    prompt = payload.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    try:
        logger.info(f"[AI] /perplexity-search: {prompt[:80]}...")
        answer = await perplexity_search(prompt)
        return {"answer": answer}

    except Exception as e:
        logger.error(f"[AI] /perplexity-search error: {e}")
        raise HTTPException(status_code=500, detail="AI search error")


# ============================================================
#  /perplexity-embed  (embeddings)
# ============================================================

@router.post("/perplexity-embed")
async def ai_perplexity_embed(payload: PerplexityRequest):
    text = payload.prompt.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    try:
        logger.info(f"[AI] /perplexity-embed: {text[:80]}...")
        embedding = await perplexity_embed(text)
        return {"embedding": embedding}

    except Exception as e:
        logger.error(f"[AI] /perplexity-embed error: {e}")
        raise HTTPException(status_code=500, detail="AI embedding error")


# ============================================================
#  /perplexity-stream  (SSE streaming)
# ============================================================

@router.post("/perplexity-stream")
async def ai_perplexity_stream(payload: PerplexityRequest):
    """
    Streams Perplexity output token-by-token.
    This is your existing 'stream pero' endpoint.
    """
    prompt = payload.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    try:
        logger.info(f"[AI] /perplexity-stream: {prompt[:80]}...")

        async def event_stream():
            async for chunk in stream_perplexity(prompt):
                # chunk is already formatted as SSE: "data: ...\n\n"
                yield chunk

        return StreamingResponse(event_stream(), media_type="text/event-stream")

    except Exception as e:
        logger.error(f"[AI] /perplexity-stream error: {e}")
        raise HTTPException(status_code=500, detail="AI streaming error")