from __future__ import annotations

from typing import Any, Dict, Optional

from ai.ai_logger import get_logger
from ai.db import DB

logger = get_logger("gcz-ai.memory")


async def add_memory(
    category: str,
    message: str,
    source: str = "system",
    meta: Optional[Dict[str, Any]] = None,
) -> bool:
    logger.info("Recording memory", extra={"category": category, "source": source})
    return await DB.execute(
        """
        INSERT INTO ai_memory (category, message, source, meta)
        VALUES ($1, $2, $3, $4::jsonb)
        """,
        (category, message, source, meta or {}),
    )


async def log_health(
    service: str,
    status: str,
    details: Optional[Dict[str, Any]] = None,
) -> bool:
    logger.info("Recording health", extra={"service": service, "status": status})
    return await DB.execute(
        """
        INSERT INTO service_health (service, status, details)
        VALUES ($1, $2, $3::jsonb)
        """,
        (service, status, details or {}),
    )


async def log_anomaly(
    anomaly_type: str,
    message: str,
    meta: Optional[Dict[str, Any]] = None,
) -> bool:
    logger.warning("Recording anomaly", extra={"type": anomaly_type, "anomaly_message": message})
    return await DB.execute(
        """
        INSERT INTO anomalies (type, message, meta)
        VALUES ($1, $2, $3::jsonb)
        """,
        (anomaly_type, message, meta or {}),
    )


__all__ = ["add_memory", "log_health", "log_anomaly"]
