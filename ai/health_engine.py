from __future__ import annotations

from typing import Any, Dict

from ai.ai_logger import get_logger
from ai.db import DB
from ai.memory_store import log_health, log_anomaly

logger = get_logger("gcz-ai.health")


def _json_safe(value: Any) -> Any:
    if isinstance(value, dict):
        return value
    return {"raw": str(value)}


async def _check_db() -> Dict[str, Any]:
    row = await DB.fetchrow("SELECT 1 AS ok;")
    ok = bool(row and row.get("ok") == 1)
    return {"service": "db", "ok": ok, "details": _json_safe(row or {})}


async def run_health_scan() -> Dict[str, Any]:
    results: Dict[str, Any] = {}

    try:
        db_result = await _check_db()
        results["db"] = db_result

        if db_result["ok"]:
            await log_health("db", "ok", db_result["details"])
            logger.info("Health scan OK")
        else:
            await log_health("db", "error", db_result["details"])
            await log_anomaly(
                "db_failure",
                "DB health check returned non-OK result",
                db_result["details"],
            )
            logger.error("Health scan DB not OK")
    except Exception as exc:
        err = {"error": str(exc)}
        await log_health("db", "error", err)
        await log_anomaly("db_failure", "DB health scan crashed", err)
        logger.error("Health scan exception", extra={"error": str(exc)})
        results["db"] = {"service": "db", "ok": False, "error": str(exc)}

    return results


__all__ = ["run_health_scan"]
