import os
import re
from typing import Any, Dict, List, Optional

from fastapi import APIRouter

from backend.logger import get_logger
from services.db import get_db

router = APIRouter(prefix="/api", tags=["Live Dashboard"])
logger = get_logger("gcz-live-dashboard")

_PROMO_COLUMNS: Optional[set] = None

CODE_REGEX = re.compile(r"\b[A-Z0-9]{4,20}\b")
URL_REGEX = re.compile(r"https?://[^\s]+", re.IGNORECASE)


def extract_code(text: str) -> str:
    match = CODE_REGEX.search(text or "")
    return match.group(0) if match else ""


def extract_url(text: str) -> str:
    match = URL_REGEX.search(text or "")
    if not match:
        return ""
    return match.group(0).rstrip(".,;!?")


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
        logger.warning("[LIVE] Failed to read promos columns: %s", exc)
        _PROMO_COLUMNS = set()
    return _PROMO_COLUMNS


def resolve_site(row: Dict[str, Any]) -> str:
    return (
        row.get("affiliate_name")
        or row.get("casino_name")
        or row.get("site")
        or "Unknown"
    )


def resolve_description(row: Dict[str, Any]) -> str:
    return (
        row.get("description")
        or row.get("content")
        or row.get("raw_text")
        or row.get("clean_text")
        or ""
    )


def resolve_created_at(row: Dict[str, Any]) -> Optional[str]:
    created = row.get("created_at")
    if hasattr(created, "isoformat"):
        return created.isoformat()
    return str(created) if created else None


def resolve_expires_at(row: Dict[str, Any]) -> Optional[str]:
    for key in ("expires_at", "expiry", "updated_at"):
        value = row.get(key)
        if value:
            if hasattr(value, "isoformat"):
                return value.isoformat()
            return str(value)
    return None


@router.get("/live-dashboard")
async def live_dashboard(status: str = "live", limit: int = 20):
    db = await get_db()
    columns = await load_promo_columns(db)

    if not columns:
        return {"promoCodes": [], "promoLinks": []}

    if status == "live":
        statuses = ["approved", "pending"]
    elif status == "all":
        statuses = ["approved", "pending", "denied", "archived"]
    else:
        statuses = [status]

    status_clause = " OR ".join([f"p.status = ${idx + 1}" for idx in range(len(statuses))])
    limit_param_index = len(statuses) + 1

    channel_column = "channel" if "channel" in columns else "type" if "type" in columns else None
    if not channel_column:
        logger.warning("[LIVE] No channel/type column found on promos table")
        return {"promoCodes": [], "promoLinks": []}

    join_clause = ""
    if "affiliate_id" in columns:
        join_clause = "LEFT JOIN affiliates_master am ON p.affiliate_id = am.id"

    select_columns = ["p.id", "p.created_at", "p.updated_at"]
    for col in (
        "content",
        "clean_text",
        "raw_text",
        "description",
        "bonus_code",
        "promo_url",
        "url",
        "code",
        "casino_name",
        "site",
        "expires_at",
        "expiry",
    ):
        if col in columns:
            select_columns.append(f"p.{col}")

    if join_clause:
        select_columns.extend(["am.name AS affiliate_name", "am.affiliate_url AS affiliate_url"])

    select_sql = ", ".join(select_columns)

    promo_codes_query = f"""
        SELECT {select_sql}
        FROM promos p
        {join_clause}
        WHERE ({status_clause})
          AND p.{channel_column} IN ('codes', 'code')
        ORDER BY p.created_at DESC
        LIMIT ${limit_param_index}
    """

    promo_links_query = f"""
        SELECT {select_sql}
        FROM promos p
        {join_clause}
        WHERE ({status_clause})
          AND p.{channel_column} IN ('links', 'link', 'url')
        ORDER BY p.created_at DESC
        LIMIT ${limit_param_index}
    """

    params = statuses + [limit]

    codes_rows = await db.fetch(promo_codes_query, *params)
    links_rows = await db.fetch(promo_links_query, *params)

    promo_codes = []
    for row in codes_rows:
        row_dict = dict(row)
        description = resolve_description(row_dict)
        code = row_dict.get("bonus_code") or row_dict.get("code") or extract_code(description)
        promo_codes.append(
            {
                "id": str(row_dict.get("id")),
                "site": resolve_site(row_dict),
                "code": code or "",
                "description": description,
                "expiresAt": resolve_expires_at(row_dict),
                "createdAt": resolve_created_at(row_dict),
            }
        )

    promo_links = []
    for row in links_rows:
        row_dict = dict(row)
        description = resolve_description(row_dict)
        url = row_dict.get("promo_url") or row_dict.get("url") or extract_url(description)
        promo_links.append(
            {
                "id": str(row_dict.get("id")),
                "site": resolve_site(row_dict),
                "url": url or "",
                "description": description,
                "createdAt": resolve_created_at(row_dict),
            }
        )

    return {"promoCodes": promo_codes, "promoLinks": promo_links}
