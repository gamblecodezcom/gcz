from __future__ import annotations

import json
import re
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

RULES_PATH = Path(__file__).with_name("promo_rules.json")

DEFAULT_RULES: Dict[str, Any] = {
    "version": 1,
    "updated_at": None,
    "cta_phrases": [
        "Claim now",
        "Join here",
        "Grab the bonus",
        "Play now",
    ],
    "cta_position": "end",
    "affiliate": {
        "base_url": "https://gamblecodez.com",
        "redirect_path": "/redirect",
        "cta_template": "🔗 Not yet signed up? {affiliate_link}",
    },
    "templates": [
        "🎁 {headline}\n{description}\n\n💎 Code: {code}\n🔗 {url}\n\n{cta}",
        "🎁 {headline}\n{description}\n\n🔗 {url}\n\n{cta}",
        "🎁 {headline}\n{description}\n\n💎 Code: {code}\n\n{cta}",
        "{description}\n\n{cta}",
    ],
    "regex": {
        "code": "\\b[A-Z0-9]{4,20}\\b",
        "url": "https?://[^\\s]+",
    },
}


def load_rules() -> Dict[str, Any]:
    if RULES_PATH.exists():
        try:
            data = json.loads(RULES_PATH.read_text())
            if isinstance(data, dict):
                return data
        except Exception:
            pass
    return deepcopy(DEFAULT_RULES)


def save_rules(rules: Dict[str, Any]) -> None:
    payload = deepcopy(rules)
    if not payload.get("updated_at"):
        payload["updated_at"] = datetime.now(timezone.utc).isoformat()
    RULES_PATH.write_text(json.dumps(payload, indent=2))


def _extract_code(text: str, rules: Dict[str, Any]) -> Optional[str]:
    pattern = rules.get("regex", {}).get("code") or DEFAULT_RULES["regex"]["code"]
    try:
        match = re.search(pattern, text or "", re.IGNORECASE)
        if match:
            return match.group(0).strip()
    except Exception:
        return None
    return None


def _extract_url(text: str, rules: Dict[str, Any]) -> Optional[str]:
    pattern = rules.get("regex", {}).get("url") or DEFAULT_RULES["regex"]["url"]
    try:
        match = re.search(pattern, text or "", re.IGNORECASE)
        if match:
            return match.group(0).strip().rstrip(".,;!?")
    except Exception:
        return None
    return None


def _pick_cta(rules: Dict[str, Any]) -> str:
    phrases = rules.get("cta_phrases") or DEFAULT_RULES["cta_phrases"]
    return phrases[0] if phrases else "Claim now"


def _build_affiliate_link(promo: Dict[str, Any], rules: Dict[str, Any]) -> Optional[str]:
    if promo.get("affiliate_link"):
        return promo["affiliate_link"]
    affiliate_id = promo.get("affiliate_id")
    affiliate_name = promo.get("affiliate_name") or promo.get("affiliate_slug")
    base_url = rules.get("affiliate", {}).get("base_url") or DEFAULT_RULES["affiliate"]["base_url"]
    redirect_path = rules.get("affiliate", {}).get("redirect_path") or DEFAULT_RULES["affiliate"]["redirect_path"]

    target = affiliate_name or affiliate_id
    if not target:
        return None
    return f"{base_url}{redirect_path}/{target}"


def _render_template(template: str, data: Dict[str, Any]) -> str:
    rendered = template
    for key, value in data.items():
        rendered = rendered.replace("{" + key + "}", value or "")
    lines = [line.rstrip() for line in rendered.splitlines()]
    return "\n".join([line for line in lines if line.strip()])


def _select_template(rules: Dict[str, Any], has_code: bool, has_url: bool) -> str:
    templates = rules.get("templates") or DEFAULT_RULES["templates"]
    for template in templates:
        if "{code}" in template and not has_code:
            continue
        if "{url}" in template and not has_url:
            continue
        return template
    return templates[-1]


def format_promo(promo: Dict[str, Any], rules: Optional[Dict[str, Any]] = None) -> str:
    ruleset = rules or load_rules()
    base_text = promo.get("clean_text") or promo.get("content") or promo.get("raw_text") or ""
    headline = promo.get("headline") or promo.get("title") or promo.get("casino_name") or "Promo Update"
    description = promo.get("description") or base_text

    code = promo.get("bonus_code") or _extract_code(base_text, ruleset) or ""
    url = promo.get("promo_url") or _extract_url(base_text, ruleset) or ""

    affiliate_link = _build_affiliate_link(promo, ruleset)
    cta_phrase = promo.get("cta") or _pick_cta(ruleset)

    if affiliate_link:
        cta_template = ruleset.get("affiliate", {}).get("cta_template") or DEFAULT_RULES["affiliate"]["cta_template"]
        cta = _render_template(cta_template, {"affiliate_link": affiliate_link, "cta": cta_phrase})
    else:
        cta = cta_phrase

    template = _select_template(ruleset, bool(code), bool(url))
    return _render_template(
        template,
        {
            "headline": headline,
            "description": description,
            "code": code,
            "url": url,
            "cta": cta,
        },
    )


__all__ = ["load_rules", "save_rules", "format_promo", "DEFAULT_RULES"]
