#!/usr/bin/env python3
"""
Monthly promo intelligence scan (sandbox).
Analyzes Discord + Telegram history from DB, extracts formatting patterns,
updates shared promo rules, and logs findings into ai_memory.
"""

from __future__ import annotations

import asyncio
import re
from collections import Counter
from datetime import datetime, timedelta
from typing import Any, Dict, List

import os

from ai.db import DB
from ai.memory_store import add_memory
from ai.shared.promo_rules import DEFAULT_RULES, load_rules, save_rules

ENV = os.getenv("GCZ_ENV", "sandbox").lower()

if ENV != "sandbox":
    raise SystemExit("promo_intel_scan must run in sandbox mode")

CTA_KEYWORDS = [
    "claim",
    "join",
    "sign",
    "signup",
    "redeem",
    "play",
    "use code",
    "click",
]

CODE_RE = re.compile(r"\b[A-Z0-9]{4,20}\b")
URL_RE = re.compile(r"https?://[^\s]+", re.IGNORECASE)


def _extract_lines(text: str) -> List[str]:
    return [line.strip() for line in text.splitlines() if line.strip()]


def _extract_cta(lines: List[str]) -> List[str]:
    hits = []
    for line in lines:
        lowered = line.lower()
        if any(keyword in lowered for keyword in CTA_KEYWORDS):
            hits.append(line)
    return hits


def _domains_from_urls(text: str) -> List[str]:
    domains = []
    for match in URL_RE.findall(text or ""):
        try:
            domain = re.sub(r"^https?://", "", match).split("/")[0].lower()
            domains.append(domain)
        except Exception:
            continue
    return domains


async def _fetch_messages() -> Dict[str, List[str]]:
    since = datetime.utcnow() - timedelta(days=30)
    discord_msgs: List[str] = []
    telegram_msgs: List[str] = []

    # Discord history (raw messages table)
    discord_rows = await DB.fetch(
        """
        SELECT raw_content AS text
        FROM discord_messages
        WHERE created_at >= $1
        ORDER BY created_at DESC
        LIMIT 5000
        """,
        [since],
    )
    for row in discord_rows:
        text = (row.get("text") or "").strip()
        if text:
            discord_msgs.append(text)

    # Promos table (source-aware)
    promo_rows = await DB.fetch(
        """
        SELECT source, COALESCE(clean_text, content) AS text
        FROM promos
        WHERE created_at >= $1
        ORDER BY created_at DESC
        LIMIT 5000
        """,
        [since],
    )
    for row in promo_rows:
        text = (row.get("text") or "").strip()
        if not text:
            continue
        source = (row.get("source") or "").lower()
        if "telegram" in source:
            telegram_msgs.append(text)
        else:
            discord_msgs.append(text)

    # Telegram logs (broadcasts/notifications)
    telegram_rows = await DB.fetch(
        """
        SELECT message AS text
        FROM telegram_logs
        WHERE created_at >= $1
        ORDER BY created_at DESC
        LIMIT 5000
        """,
        [since],
    )
    for row in telegram_rows:
        text = (row.get("text") or "").strip()
        if text:
            telegram_msgs.append(text)

    return {"discord": discord_msgs, "telegram": telegram_msgs}


async def _fetch_affiliate_domains() -> List[str]:
    rows = await DB.fetch(
        """
        SELECT affiliate_url, url
        FROM affiliates_master
        WHERE affiliate_url IS NOT NULL OR url IS NOT NULL
        """,
    )
    domains: List[str] = []
    for row in rows:
        for key in ("affiliate_url", "url"):
            url = row.get(key)
            if not url:
                continue
            domain = re.sub(r"^https?://", "", url).split("/")[0].lower()
            if domain:
                domains.append(domain)
    return list(set(domains))


def _analyze(messages: List[str], affiliate_domains: List[str]) -> Dict[str, Any]:
    total = len(messages)
    if total == 0:
        return {
            "total": 0,
            "code_rate": 0,
            "url_rate": 0,
            "cta_position": "end",
            "cta_phrases": DEFAULT_RULES["cta_phrases"],
            "affiliate_append": "end",
        }

    code_hits = 0
    url_hits = 0
    cta_positions = Counter()
    cta_phrases: List[str] = []
    affiliate_positions = Counter()

    for text in messages:
        lines = _extract_lines(text)
        has_code = bool(CODE_RE.search(text))
        has_url = bool(URL_RE.search(text))
        if has_code:
            code_hits += 1
        if has_url:
            url_hits += 1

        ctas = _extract_cta(lines)
        if ctas:
            cta_phrases.extend(ctas)
            cta_index = max(0, min(len(lines) - 1, lines.index(ctas[0])))
            if cta_index >= max(0, len(lines) - 2):
                cta_positions["end"] += 1
            else:
                cta_positions["start"] += 1

        domains = _domains_from_urls(text)
        if domains:
            if any(domain in affiliate_domains for domain in domains):
                if lines and any(domain in lines[-1].lower() for domain in domains):
                    affiliate_positions["end"] += 1
                else:
                    affiliate_positions["middle"] += 1

    code_rate = code_hits / total
    url_rate = url_hits / total

    if cta_positions:
        cta_position = "end" if cta_positions["end"] >= cta_positions["start"] else "start"
    else:
        cta_position = DEFAULT_RULES["cta_position"]

    phrase_counts = Counter([p.strip() for p in cta_phrases if len(p.strip()) <= 120])
    top_phrases = [p for p, _ in phrase_counts.most_common(6)] or DEFAULT_RULES["cta_phrases"]

    affiliate_append = "end" if affiliate_positions["end"] >= affiliate_positions["middle"] else "middle"

    return {
        "total": total,
        "code_rate": round(code_rate, 3),
        "url_rate": round(url_rate, 3),
        "cta_position": cta_position,
        "cta_phrases": top_phrases,
        "affiliate_append": affiliate_append,
    }


def _build_templates(stats: Dict[str, Any]) -> List[str]:
    templates = []
    if stats["code_rate"] > 0.35 and stats["url_rate"] > 0.35:
        templates.append("🎁 {headline}\n{description}\n\n💎 Code: {code}\n🔗 {url}\n\n{cta}")
    if stats["url_rate"] > 0.35:
        templates.append("🎁 {headline}\n{description}\n\n🔗 {url}\n\n{cta}")
    if stats["code_rate"] > 0.35:
        templates.append("🎁 {headline}\n{description}\n\n💎 Code: {code}\n\n{cta}")
    templates.append("{description}\n\n{cta}")
    return templates


async def run_scan() -> Dict[str, Any]:
    await DB.init()

    messages = await _fetch_messages()
    affiliate_domains = await _fetch_affiliate_domains()

    discord_stats = _analyze(messages["discord"], affiliate_domains)
    telegram_stats = _analyze(messages["telegram"], affiliate_domains)

    combined_stats = {
        "total": discord_stats["total"] + telegram_stats["total"],
        "code_rate": round((discord_stats["code_rate"] + telegram_stats["code_rate"]) / 2, 3),
        "url_rate": round((discord_stats["url_rate"] + telegram_stats["url_rate"]) / 2, 3),
    }

    rules = load_rules()
    rules["updated_at"] = datetime.utcnow().isoformat() + "Z"
    rules["cta_phrases"] = telegram_stats["cta_phrases"] or discord_stats["cta_phrases"]
    rules["cta_position"] = telegram_stats["cta_position"]
    rules["templates"] = _build_templates({
        "code_rate": combined_stats["code_rate"],
        "url_rate": combined_stats["url_rate"],
    })
    rules.setdefault("affiliate", {})
    rules["affiliate"]["append_position"] = telegram_stats["affiliate_append"]
    rules["affiliate"]["domains"] = affiliate_domains

    save_rules(rules)

    summary = {
        "discord": discord_stats,
        "telegram": telegram_stats,
        "combined": combined_stats,
        "templates": rules["templates"],
    }

    await add_memory(
        "sandbox.promo_intel",
        "promo_rules_updated",
        source="promo_intel_scan",
        meta=summary,
    )

    return summary


def main() -> None:
    summary = asyncio.run(run_scan())
    print("Promo intelligence scan complete")
    print(summary)


if __name__ == "__main__":
    main()
