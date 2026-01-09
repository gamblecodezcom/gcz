import os
import re
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.logger import get_logger
from services.db import get_db

router = APIRouter(prefix="/api/drops", tags=["Drops"])
logger = get_logger("gcz-drops-intake")

_PROMO_COLUMNS: Optional[set] = None

CODE_REGEX = re.compile(r"\b[A-Z0-9]{4,20}\b")
URL_REGEX = re.compile(r"https?://[^\s]+", re.IGNORECASE)


class PromoIntakeRequest(BaseModel):
    casino_name: Optional[str] = None
    affiliate_url: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    expiry: Optional[str] = None
    tags: Optional[List[str]] = None
    source: Optional[str] = "discord"
    raw_text: Optional[str] = None
    content: Optional[str] = None
    source_channel_id: Optional[str] = None
    source_user_id: Optional[str] = None
    source_username: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

    class Config:
        extra = "allow"


def normalize_text(text: Optional[str]) -> str:
    if not text:
        return ""
    return " ".join(str(text).strip().split())


def clean_title(text: str) -> str:
    if not text:
        return ""
    candidate = text.splitlines()[0].strip()
    candidate = URL_REGEX.sub("", candidate).strip()
    if len(candidate) > 120:
        candidate = candidate[:117].rstrip() + "..."
    return candidate


def detect_channel(text: str, source_channel: Optional[str]) -> str:
    if source_channel in {"links", "codes"}:
        return source_channel
    if URL_REGEX.search(text):
        return "links"
    if CODE_REGEX.search(text):
        return "codes"
    return "codes"


def detect_promo_type(text: str) -> str:
    if URL_REGEX.search(text):
        return "url"
    if CODE_REGEX.search(text):
        return "code"
    return "unknown"


def review_promo(text: str) -> Dict[str, Any]:
    normalized = normalize_text(text)
    promo_type = detect_promo_type(normalized)
    if not normalized or len(normalized) < 5:
        return {
            "decision": "likely_spam",
            "confidence": 0.1,
            "type": promo_type,
            "reason": "empty_or_short",
        }
    confidence = 0.78 if promo_type in {"url", "code"} else 0.35
    return {
        "decision": "likely_valid" if promo_type in {"url", "code"} else "uncertain",
        "confidence": confidence,
        "type": promo_type,
        "reason": "pattern_match" if promo_type in {"url", "code"} else "no_pattern",
    }


def should_auto_approve(review: Dict[str, Any]) -> bool:
    if os.getenv("PROMO_AUTO_APPROVE", "false").lower() != "true":
        return False
    try:
        min_conf = float(os.getenv("PROMO_AUTO_APPROVE_MIN_CONF", "0.85"))
    except ValueError:
        min_conf = 0.85
    return review.get("decision") == "likely_valid" and review.get("confidence", 0) >= min_conf


def normalize_tags(tags: Any) -> List[str]:
    if not tags:
        return []
    if isinstance(tags, list):
        return [str(tag).strip() for tag in tags if str(tag).strip()]
    if isinstance(tags, str):
        return [tag.strip() for tag in tags.split(",") if tag.strip()]
    return []


async def load_promo_columns(db) -> set:
    global _PROMO_COLUMNS
    if _PROMO_COLUMNS is not None:
        return _PROMO_COLUMNS
    try:
        rows = await db.fetch(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'promos'
            """
        )
        _PROMO_COLUMNS = {row["column_name"] for row in rows}
    except Exception as exc:
        logger.warning("[PROMO] Failed to read promos columns: %s", exc)
        _PROMO_COLUMNS = set()
    return _PROMO_COLUMNS


async def find_duplicate(db, columns: set, text: str) -> Optional[int]:
    if not text:
        return None
    column = None
    for candidate in ("raw_text", "content", "clean_text", "cleaned_text"):
        if candidate in columns:
            column = candidate
            break
    if not column:
        return None
    window_days = int(os.getenv("PROMO_DEDUPE_DAYS", "7"))
    query = f"""
        SELECT id FROM promos
        WHERE {column} = $1
          AND created_at > NOW() - INTERVAL '{window_days} days'
        LIMIT 1
    """
    result = await db.fetchrow(query, text)
    return result["id"] if result else None


async def find_affiliate_id(db, casino_name: Optional[str], affiliate_url: Optional[str]) -> Optional[int]:
    if casino_name:
        row = await db.fetchrow(
            "SELECT id FROM affiliates_master WHERE lower(name) = lower($1) LIMIT 1",
            casino_name,
        )
        if row:
            return row["id"]
    if affiliate_url:
        row = await db.fetchrow(
            "SELECT id FROM affiliates_master WHERE affiliate_url = $1 OR url = $1 LIMIT 1",
            affiliate_url,
        )
        if row:
            return row["id"]
    return None


@router.post("/intake")
async def promo_intake(payload: PromoIntakeRequest):
    raw_text = normalize_text(payload.raw_text or payload.content or payload.description)
    if not raw_text:
        raise HTTPException(status_code=400, detail="raw_text or description required")

    description = normalize_text(payload.description or raw_text)
    title = clean_title(payload.title or description)
    raw_tags = payload.tags or (payload.metadata or {}).get("tags") if payload.metadata else payload.tags
    tags = normalize_tags(raw_tags)
    source = (payload.source or "discord").lower()
    if source not in {"discord", "ai", "manual", "site_form", "web", "bot", "telegram"}:
        source = "manual"

    channel = detect_channel(raw_text, payload.source_channel_id)
    review = review_promo(raw_text)

    db = await get_db()
    columns = await load_promo_columns(db)

    existing_id = await find_duplicate(db, columns, raw_text)
    if existing_id:
        logger.info("[PROMO] Duplicate intake ignored id=%s", existing_id)
        return {
            "ok": True,
            "duplicate": True,
            "promo_id": existing_id,
            "raw_drop": {"id": existing_id},
        }

    affiliate_id = await find_affiliate_id(db, payload.casino_name, payload.affiliate_url)

    status = "approved" if should_auto_approve(review) else "pending"
    now = datetime.utcnow()

    promo_payload: Dict[str, Any] = {
        "source": source,
        "channel": channel,
        "content": description,
        "clean_text": title or description,
        "submitted_by": payload.source_user_id or payload.source_username or "system",
        "status": status,
        "affiliate_id": affiliate_id,
        "raw_text": raw_text,
        "cleaned_text": title or description,
        "ai_type": review.get("type"),
        "ai_confidence": review.get("confidence"),
        "ai_decision": review.get("decision"),
    }

    if status == "approved":
        promo_payload.update(
            {
                "reviewed_by": "auto",
                "reviewed_at": now,
                "approved_by": "auto",
                "approved_at": now,
            }
        )

    if payload.source_user_id:
        promo_payload["created_by_discord_id"] = payload.source_user_id

    if "expires_at" in columns and payload.expiry:
        promo_payload["expires_at"] = payload.expiry
    if "expiry" in columns and payload.expiry:
        promo_payload["expiry"] = payload.expiry
    if "title" in columns and title:
        promo_payload["title"] = title
    if "casino_name" in columns and payload.casino_name:
        promo_payload["casino_name"] = payload.casino_name
    if "affiliate_url" in columns and payload.affiliate_url:
        promo_payload["affiliate_url"] = payload.affiliate_url
    if "tags" in columns and tags:
        promo_payload["tags"] = tags
    if "metadata" in columns and payload.metadata:
        promo_payload["metadata"] = payload.metadata

    available_keys = [key for key in promo_payload.keys() if key in columns]
    if not available_keys:
        logger.error("[PROMO] No compatible columns found for promo insert")
        raise HTTPException(status_code=500, detail="Promos table schema mismatch")

    placeholders = [f"${idx + 1}" for idx in range(len(available_keys))]
    values = [promo_payload[key] for key in available_keys]

    query = f"""
        INSERT INTO promos ({", ".join(available_keys)})
        VALUES ({", ".join(placeholders)})
        RETURNING id
    """

    try:
        row = await db.fetchrow(query, *values)
    except Exception as exc:
        logger.exception("[PROMO] Failed to insert promo")
        raise HTTPException(status_code=500, detail="Failed to store promo") from exc

    promo_id = row["id"]
    logger.info("[PROMO] Intake stored id=%s source=%s channel=%s", promo_id, source, channel)

    return {
        "ok": True,
        "promo_id": promo_id,
        "raw_drop": {"id": promo_id},
        "promo": {
            "casino_name": payload.casino_name,
            "affiliate_url": payload.affiliate_url,
            "title": title,
            "description": description,
            "expiry": payload.expiry,
            "tags": tags or [],
            "source": source,
        },
    }
