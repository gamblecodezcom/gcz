"""
backend/utils/__init__.py

Unified utility exports for GambleCodez backend.

This file exposes all core utility functions used across:
- SC logic
- time helpers
- crypto hashing
- field validation

Modules:
- time.py
- crypto.py
- validators.py
- sc.py

These functions power:
- SC drops, raffles, and Runewager tips
- Timestamp generation and window checks
- Hashing for secure tokens and IDs
- Field validation for API payloads
"""

# Time helpers
from .time import (
    utc_now,
    add_minutes,
    add_hours,
    add_days,
    seconds_from_now,
)

# Crypto helpers
from .crypto import sha256, sha1

# Validators
from .validators import require_fields

# SC engine
from .sc import (
    usd_to_sc,
    sc_to_usd,
    validate_sc,
    validate_sc_range,
    format_sc,
    add_sc,
    subtract_sc,
    multiply_sc,
    get_site_rules,
    eligible_for_runewager_tip,
    calculate_runewager_reward,
    calculate_drop_reward,
    can_enter_raffle,
    raffle_entry_cost,
    within_last_7_days,
)

__all__ = [
    # Time
    "utc_now",
    "add_minutes",
    "add_hours",
    "add_days",
    "seconds_from_now",

    # Crypto
    "sha256",
    "sha1",

    # Validators
    "require_fields",

    # SC engine
    "usd_to_sc",
    "sc_to_usd",
    "validate_sc",
    "validate_sc_range",
    "format_sc",
    "add_sc",
    "subtract_sc",
    "multiply_sc",
    "get_site_rules",
    "eligible_for_runewager_tip",
    "calculate_runewager_reward",
    "calculate_drop_reward",
    "can_enter_raffle",
    "raffle_entry_cost",
    "within_last_7_days",
]