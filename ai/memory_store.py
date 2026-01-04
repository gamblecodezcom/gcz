from .db import execute

def add_memory(category, message, source="system", meta=None):
    execute(
        """
        INSERT INTO ai_memory (category, message, source, meta)
        VALUES (%s, %s, %s, %s)
        """,
        (category, message, source, meta),
    )

def log_health(service, status, details=None):
    execute(
        """
        INSERT INTO service_health (service, status, details)
        VALUES (%s, %s, %s)
        """,
        (service, status, details),
    )

def log_anomaly(anomaly_type, message, meta=None):
    execute(
        """
        INSERT INTO anomalies (type, message, meta)
        VALUES (%s, %s, %s)
        """,
        (anomaly_type, message, meta),
    )