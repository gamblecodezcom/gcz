from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Dict

from dotenv import dotenv_values


@dataclass(frozen=True)
class Settings:
    environment: str
    database_url: str | None
    log_dir: Path
    ai_port: int
    ai_timeout_s: float
    ai_retries: int
    monitor_interval: int
    openai_api_key: str | None
    openai_model: str
    perplexity_api_key: str | None
    perplexity_model: str
    cursor_api_key: str | None
    cursor_api_url: str


def _resolve_env_paths(repo_root: Path) -> list[Path]:
    env = os.getenv("GCZ_ENV", "").lower()
    prefer_sandbox = env == "sandbox"

    roots = [repo_root]
    for parent in repo_root.parents[:2]:
        roots.append(parent)

    candidates: list[Path] = []
    for root in roots:
        candidates.append(root / ".env.sandbox")
        candidates.append(root / ".env")
        candidates.append(root / "gcz" / ".env.sandbox")
        candidates.append(root / "gcz" / ".env")

    # De-dupe while preserving order.
    seen = set()
    ordered: list[Path] = []
    for path in candidates:
        key = str(path)
        if key in seen:
            continue
        seen.add(key)
        ordered.append(path)

    if not prefer_sandbox:
        return ordered

    sandbox_first = [p for p in ordered if p.name == ".env.sandbox"]
    regular = [p for p in ordered if p.name != ".env.sandbox"]
    return sandbox_first + regular


def load_env(repo_root: Path) -> Dict[str, str]:
    """
    Loads environment variables from ./gcz/.env first, then ./.env.
    Returns the merged key/value map without overwriting existing os.environ.
    """
    merged: Dict[str, str] = {}
    for env_path in _resolve_env_paths(repo_root):
        if not env_path.exists():
            continue
        for key, value in dotenv_values(env_path).items():
            if value is None:
                continue
            merged[key] = value
            os.environ.setdefault(key, value)
    return merged


def build_settings(repo_root: Path) -> Settings:
    load_env(repo_root)

    log_dir = Path(os.getenv("GCZ_LOG_DIR", str(repo_root / "logs")))
    return Settings(
        environment=os.getenv("GCZ_ENV", "prod").lower(),
        database_url=(
            os.getenv("GCZ_DB")
            or os.getenv("AI_AGENT_NEON_DB_URL")
            or os.getenv("DATABASE_URL")
        ),
        log_dir=log_dir,
        ai_port=int(os.getenv("AI_PORT", "8010")),
        ai_timeout_s=float(os.getenv("AI_TIMEOUT_S", "15")),
        ai_retries=int(os.getenv("AI_RETRIES", "2")),
        monitor_interval=int(os.getenv("AI_MONITOR_INTERVAL", "60")),
        openai_api_key=os.getenv("OPENAI_API_KEY"),
        openai_model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        perplexity_api_key=os.getenv("PERPLEXITY_API_KEY"),
        perplexity_model=os.getenv("PERPLEXITY_MODEL", "sonar"),
        cursor_api_key=os.getenv("CURSOR_API_KEY"),
        cursor_api_url=os.getenv("CURSOR_API_URL", "https://api.cursor.sh/v1"),
    )
