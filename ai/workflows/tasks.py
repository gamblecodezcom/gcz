from __future__ import annotations

from typing import Any, Dict

from ai.ai_logger import get_logger
from ai.health_engine import run_health_scan
from ai.memory_store import add_memory
from ai.tools.ai_clients import AIClient

logger = get_logger("gcz-ai.workflows")


async def workflow_health_scan(payload: Dict[str, Any], ai_client: AIClient) -> Dict[str, Any]:
    logger.info("Workflow health_scan started")
    return await run_health_scan()


async def workflow_memory_add(payload: Dict[str, Any], ai_client: AIClient) -> Dict[str, Any]:
    category = payload.get("category", "workflow")
    message = payload.get("message", "")
    source = payload.get("source", "workflow")
    meta = payload.get("meta", {})
    await add_memory(category, message, source, meta)
    return {"ok": True}


async def workflow_ai_generate(payload: Dict[str, Any], ai_client: AIClient) -> Dict[str, Any]:
    prompt = payload.get("prompt", "").strip()
    if not prompt:
        return {"ok": False, "error": "prompt is required"}
    response = await ai_client.generate(prompt)
    return {
        "ok": True,
        "mode": response.mode,
        "provider": response.provider,
        "text": response.text,
    }


async def workflow_echo(payload: Dict[str, Any], ai_client: AIClient) -> Dict[str, Any]:
    return {"ok": True, "payload": payload}


__all__ = [
    "workflow_health_scan",
    "workflow_memory_add",
    "workflow_ai_generate",
    "workflow_echo",
]
