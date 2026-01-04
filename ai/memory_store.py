from typing import Optional, Any, Dict
from db import execute
from ai_logger import get_logger

logger = get_logger("gcz-ai.memory")


def _json(meta: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    return meta if isinstance(meta, dict) else None


def add_memory(
    category: str,
    message: str,
    source: str = "system",
    meta: Optional[Dict[str, Any]] = None
) -> None:
    """
    Inserts a memory entry into ai_memory.
    """
    logger.debug(f"add_memory: category={category}, source={source}")
    execute(
        """
        INSERT INTO ai_memory (category, message, source, meta)
        VALUES (%s, %s, %s, %s)
        """,
        (category, message, source, _json(meta))
    )


def log_health(
    service: str,
    status: str,
    details: Optional[Dict[str, Any]] = None
) -> None:
    """
    Inserts a health check entry into service_health.
    """
    logger.debug(f"log_health: service={service}, status={status}")
    execute(
        """
        INSERT INTO service_health (service, status, details)
        VALUES (%s, %s, %s)
        """,
        (service, status, _json(details))
    )


def log_anomaly(
    anomaly_type: str,
    message: str,
    meta: Optional[Dict[str, Any]] = None
) -> None:
    """
    Inserts an anomaly entry into anomalies.
    """
    logger.warning(f"log_anomaly: type={anomaly_type}, message={message}")
    execute(
        """
        INSERT INTO anomalies (type, message, meta)
        VALUES (%s, %s, %s)
        """,
        (anomaly_type, message, _json(meta))
    )