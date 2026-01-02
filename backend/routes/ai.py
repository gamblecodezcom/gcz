from fastapi import APIRouter
from services.ai.perplexity_client import sonar_pro

router = APIRouter()

@router.post("/ai/sonar")
async def ai_sonar(payload: dict):
    prompt = payload.get("prompt", "")
    answer = sonar_pro(prompt)
    return {"answer": answer}