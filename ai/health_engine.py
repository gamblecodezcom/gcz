from typing import Dict, Any
import json
from db import fetchone
from memory_store import log_health, log_anomaly
from ai_logger import get_logger

logger = get_logger("gcz-ai.health")


def _json_safe(value: Any) -> Any:
    """
    Converts psycopg2 RealDictRow or any non-JSON-serializable
    object into a JSON-safe dict or string.
    """
    try:
        # Convert RealDictRow → dict
        if hasattr(value, "items"):
            value = dict(value)

        # Try JSON dump to validate
        json.dumps(value)
        return value
    except Exception:
        # Fallback: convert to string
        return {"raw": str(value)}


def _check_db() -> Dict[str, Any]:
    """
    Simple DB health check using SELECT 1.
    Returns a structured, JSON-safe result dict.
    """
    row = fetchone("SELECT 1 AS ok;")
    ok = bool(row and row.get("ok") == 1)

    return {
        "service": "neon_db",
        "ok": ok,
        "details": _json_safe(row or {})
    }


def run_health_scan() -> Dict[str, Any]:
    """
    Runs a full health scan of the AI system.
    Logs to service_health and anomalies.
    Returns a summary dict.
    """
    results = {}

    try:
        db_result = _check_db()
        results["neon_db"] = db_result

        if db_result["ok"]:
            log_health("neon_db", "ok", db_result["details"])
            logger.info("Health scan: neon_db OK")

        else:
            log_health("neon_db", "error", db_result["details"])
            log_anomaly(
                "db_failure",
                "Neon DB health check returned non-OK result",
                db_result["details"]
            )
            logger.error("Health scan: neon_db NOT OK")

    except Exception as e:
        err = {"error": str(e)}
        log_health("neon_db", "error", err)
        log_anomaly("db_failure", "Neon DB health scan crashed", err)
        logger.error(f"Health scan exception: {e}")

        results["neon_db"] = {
            "service": "neon_db",
            "ok": False,
            "error": str(e)
        }

    return results