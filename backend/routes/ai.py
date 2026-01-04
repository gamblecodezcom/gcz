from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from logger import get_logger
from services.ai import ask_perplexity, stream_perplexity, perplexity_search, perplexity_embed

router = APIRouter(prefix="/api/ai", tags=["AI"])
logger = get_logger("gcz-ai")


class PerplexityRequest(BaseModel):
    prompt: str


@router.post("/perplexity")
async def ai_perplexity(payload: PerplexityRequest):
    prompt = payload.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    try:
        logger.info(f"[AI] /perplexity: {prompt[:80]}...")
        answer = ask_perplexity(prompt)
        return {"answer": answer}
    except Exception as e:
        logger.error(f"[AI] /perplexity error: {e}")
        raise HTTPException(status_code=500, detail="AI processing error")


@router.post("/perplexity-search")
async def ai_perplexity_search(payload: PerplexityRequest):
    prompt = payload.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    try:
        logger.info(f"[AI] /perplexity-search: {prompt[:80]}...")
        answer = perplexity_search(prompt)
        return {"answer": answer}
    except Exception as e:
        logger.error(f"[AI] /perplexity-search error: {e}")
        raise HTTPException(status_code=500, detail="AI search error")


@router.post("/perplexity-embed")
async def ai_perplexity_embed(payload: PerplexityRequest):
    text = payload.prompt.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    try:
        logger.info(f"[AI] /perplexity-embed: {text[:80]}...")
        embedding = perplexity_embed(text)
        return {"embedding": embedding}
    except Exception as e:
        logger.error(f"[AI] /perplexity-embed error: {e}")
        raise HTTPException(status_code=500, detail="AI embedding error")