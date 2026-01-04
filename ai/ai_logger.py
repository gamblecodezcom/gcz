from typing import Optional, Any, Dict
from .db import execute


# ============================================================
# HELPERS
# ============================================================

def _json(meta: Optional[Dict[str, Any]]):
    """
    Ensures meta is stored as JSON or NULL cleanly.
    """
    return meta if isinstance(meta, dict) else None


# ============================================================
# AI MEMORY
# ============================================================

def add_memory(category: str, message: str,
               source: str = "system",
               meta: Optional[Dict[str, Any]] = None):
    execute(
        """
        INSERT INTO ai_memory (category, message, source, meta)
        VALUES (%s, %s, %s, %s)
        """,
        (category, message, source, _json(meta)),
    )


# ============================================================
# SERVICE HEALTH
# ============================================================

def log_health(service: str, status: str,
               details: Optional[Dict[str, Any]] = None):
    execute(
        """
        INSERT INTO service_health (service, status, details)
        VALUES (%s, %s, %s)
        """,
        (service, status, _json(details)),
    )


# ============================================================
# ANOMALIES
# ============================================================

def log_anomaly(anomaly_type: str, message: str,
                meta: Optional[Dict[str, Any]] = None):
    execute(
        """
        INSERT INTO anomalies (type, message, meta)
        VALUES (%s, %s, %s)
        """,
        (anomaly_type, message, _json(meta)),
    )


# ============================================================
# PERPLEXITY LOGGING
# ============================================================

def log_perplexity_log(prompt: str, response: str,
                       model: str,
                       tokens_used: Optional[int] = None,
                       meta: Optional[Dict[str, Any]] = None):
    execute(
        """
        INSERT INTO ai_perplexity_logs
        (prompt, response, model, tokens_used, meta)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (prompt, response, model, tokens_used, _json(meta)),
    )


def log_perplexity_search(query: str, results: Any,
                          model: str,
                          meta: Optional[Dict[str, Any]] = None):
    execute(
        """
        INSERT INTO ai_perplexity_search
        (query, results, model, meta)
        VALUES (%s, %s, %s, %s)
        """,
        (query, results, model, _json(meta)),
    )


def log_perplexity_embedding(input_text: str,
                             embedding,
                             model: str,
                             meta: Optional[Dict[str, Any]] = None):
    execute(
        """
        INSERT INTO ai_perplexity_embeddings
        (input, embedding, model, meta)
        VALUES (%s, %s, %s, %s)
        """,
        (input_text, embedding, model, _json(meta)),
    )


# ============================================================
# DISCORD INGESTION (PRIVACY-SAFE)
# ============================================================
# NOTE — You should only call these with sanitized inputs.

def log_discord_raw(discord_id: str,
                    username: str,
                    channel: str,
                    message: str,
                    meta: Optional[Dict[str, Any]] = None):
    execute(
        """
        INSERT INTO discord_messages_raw
        (discord_id, username, channel, message, meta)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (discord_id, username, channel, message, _json(meta)),
    )


def log_discord_clean(raw_id: int,
                      clean_message: str,
                      meta: Optional[Dict[str, Any]] = None):
    execute(
        """
        INSERT INTO discord_messages_clean
        (raw_id, clean_message, meta)
        VALUES (%s, %s, %s)
        """,
        (raw_id, clean_message, _json(meta)),
    )


def log_discord_promo(clean_id: int,
                      promo_code: Optional[str],
                      promo_url: Optional[str],
                      affiliate_id: Optional[int],
                      classification: str,
                      confidence: float,
                      meta: Optional[Dict[str, Any]] = None):
    execute(
        """
        INSERT INTO discord_promos
        (clean_id, promo_code, promo_url, affiliate_id,
         classification, confidence, meta)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """,
        (
            clean_id,
            promo_code,
            promo_url,
            affiliate_id,
            classification,
            confidence,
            _json(meta),
        ),
    )


# ============================================================
# DROP ENGINE
# ============================================================

def log_drop_raw(source: str,
                 message: str,
                 meta: Optional[Dict[str, Any]] = None):
    execute(
        """
        INSERT INTO drops_raw (source, message, meta)
        VALUES (%s, %s, %s)
        """,
        (source, message, _json(meta)),
    )


def log_drop_ai(raw_id: int,
                drop_type: str,
                site: str,
                bonus: Optional[str],
                confidence: float,
                meta: Optional[Dict[str, Any]] = None):
    execute(
        """
        INSERT INTO drops_ai
        (raw_id, drop_type, site, bonus, confidence, meta)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (raw_id, drop_type, site, bonus, confidence, _json(meta)),
    )


def log_drop_gratification(raw_id: int,
                           reward: str,
                           amount: float,
                           confidence: float,
                           meta: Optional[Dict[str, Any]] = None):
    execute(
        """
        INSERT INTO drops_gratification
        (raw_id, reward, amount, confidence, meta)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (raw_id, reward, amount, confidence, _json(meta)),
    )