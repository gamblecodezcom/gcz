from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Any, Dict, Optional

import httpx

from ai.ai_logger import get_logger
from ai.config.loader import Settings

logger = get_logger("gcz-ai.ai-clients")


@dataclass
class AIResponse:
    provider: str
    mode: str
    text: str
    raw: Optional[Dict[str, Any]]


class AIClient:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._timeout = httpx.Timeout(settings.ai_timeout_s)
        self._client = httpx.AsyncClient(timeout=self._timeout)

    async def close(self) -> None:
        await self._client.aclose()

    async def generate(self, prompt: str, provider: Optional[str] = None) -> AIResponse:
        provider_choice = provider or self._pick_provider()
        if not provider_choice:
            return self._fallback(prompt, "no-provider")

        if provider_choice == "openai":
            return await self._call_openai(prompt)
        if provider_choice == "perplexity":
            return await self._call_perplexity(prompt)
        if provider_choice == "cursor":
            return await self._call_cursor(prompt)

        return self._fallback(prompt, "unknown-provider")

    def _pick_provider(self) -> Optional[str]:
        if self._settings.openai_api_key:
            return "openai"
        if self._settings.perplexity_api_key:
            return "perplexity"
        if self._settings.cursor_api_key:
            return "cursor"
        return None

    async def _call_openai(self, prompt: str) -> AIResponse:
        headers = {"Authorization": f"Bearer {self._settings.openai_api_key}"}
        payload = {
            "model": self._settings.openai_model,
            "messages": [{"role": "user", "content": prompt}],
        }
        return await self._post_with_retries(
            "openai",
            "https://api.openai.com/v1/chat/completions",
            headers,
            payload,
            lambda data: data["choices"][0]["message"]["content"],
        )

    async def _call_perplexity(self, prompt: str) -> AIResponse:
        headers = {"Authorization": f"Bearer {self._settings.perplexity_api_key}"}
        payload = {
            "model": self._settings.perplexity_model,
            "messages": [{"role": "user", "content": prompt}],
        }
        return await self._post_with_retries(
            "perplexity",
            "https://api.perplexity.ai/chat/completions",
            headers,
            payload,
            lambda data: data["choices"][0]["message"]["content"],
        )

    async def _call_cursor(self, prompt: str) -> AIResponse:
        headers = {"Authorization": f"Bearer {self._settings.cursor_api_key}"}
        payload = {"prompt": prompt}
        endpoint = f"{self._settings.cursor_api_url.rstrip('/')}/chat/completions"
        return await self._post_with_retries(
            "cursor",
            endpoint,
            headers,
            payload,
            lambda data: data.get("text") or data.get("message", ""),
        )

    async def _post_with_retries(
        self,
        provider: str,
        url: str,
        headers: Dict[str, str],
        payload: Dict[str, Any],
        extract_text,
    ) -> AIResponse:
        for attempt in range(1, self._settings.ai_retries + 2):
            try:
                response = await self._client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                return AIResponse(provider=provider, mode="ai", text=extract_text(data), raw=data)
            except Exception as exc:
                logger.error(
                    "AI request failed",
                    extra={"provider": provider, "attempt": attempt, "error": str(exc)},
                )
                await asyncio.sleep(0.5 * attempt)
        return self._fallback(payload.get("prompt", ""), f"{provider}-failure")

    def _fallback(self, prompt: str, reason: str) -> AIResponse:
        text = f"[fallback:{reason}] {prompt.strip()[:400]}"
        return AIResponse(provider="fallback", mode="fallback", text=text, raw=None)


__all__ = ["AIClient", "AIResponse"]
