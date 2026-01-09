from datetime import datetime, timedelta, timezone


# ============================================================
#  BASIC CONSTANTS
# ============================================================

# Core rule: $1 USD = 1 SC
USD_TO_SC_RATE = 1
SC_TO_USD_RATE = 1

MIN_SC = 0
MAX_SC = 1_000_000_000  # safety cap


# ============================================================
#  TIME HELPERS (UTC AWARE)
# ============================================================

def utc_now() -> datetime:
    """Timezone-aware UTC timestamp."""
    return datetime.now(timezone.utc)


# ============================================================
#  BASIC CONVERSIONS
# ============================================================

def usd_to_sc(usd: float) -> int:
    """Convert USD → SC (1:1)."""
    return int(usd * USD_TO_SC_RATE)


def sc_to_usd(sc: int) -> float:
    """Convert SC → USD (1:1)."""
    validate_sc(sc)
    return float(sc) / SC_TO_USD_RATE


# ============================================================
#  VALIDATION
# ============================================================

def validate_sc(amount: int):
    if not isinstance(amount, int):
        raise ValueError("SC amount must be an integer")
    if amount < MIN_SC:
        raise ValueError("SC cannot be negative")
    if amount > MAX_SC:
        raise ValueError("SC exceeds maximum allowed")
    return True


def validate_sc_range(amount: int, min_allowed: int, max_allowed: int):
    validate_sc(amount)
    if amount < min_allowed:
        raise ValueError(f"SC must be at least {min_allowed}")
    if amount > max_allowed:
        raise ValueError(f"SC cannot exceed {max_allowed}")
    return True


# ============================================================
#  FORMATTING
# ============================================================

def format_sc(amount: int) -> str:
    """Format SC as '1,234 SC'."""
    validate_sc(amount)
    return f"{amount:,} SC"


# ============================================================
#  MATH HELPERS
# ============================================================

def add_sc(a: int, b: int) -> int:
    validate_sc(a)
    validate_sc(b)
    return a + b


def subtract_sc(a: int, b: int) -> int:
    validate_sc(a)
    validate_sc(b)
    if b > a:
        raise ValueError("Cannot subtract more SC than available")
    return a - b


def multiply_sc(amount: int, factor: float) -> int:
    validate_sc(amount)
    return int(amount * factor)


# ============================================================
#  SITE-SPECIFIC RULES
# ============================================================

SITE_RULES = {
    "runewager": {
        "type": "sc",
        "min_purchase_usd": 10,
        "wager_requirement": 3000,
        "reward_sc": 30,
        "limit_once": True,
    },
    "winna": {
        "type": "sweeps",
        "reward_multiplier": 1.0,
    },
    "cwallet": {
        "type": "crypto",
        "reward_multiplier": 1.0,
    },
}


def get_site_rules(site: str):
    return SITE_RULES.get(site.lower(), {})


# ============================================================
#  RUNEWAGER TIP ELIGIBILITY
# ============================================================

def eligible_for_runewager_tip(
    purchase_total_usd: float,
    wager_last_7_days_sc: int,
    already_claimed: bool,
):
    """Returns (eligible: bool, reason: str)."""
    rules = SITE_RULES["runewager"]

    if already_claimed and rules["limit_once"]:
        return False, "Already claimed Runewager SC tip"

    if purchase_total_usd < rules["min_purchase_usd"]:
        return False, f"Minimum ${rules['min_purchase_usd']} in purchases required"

    if wager_last_7_days_sc < rules["wager_requirement"]:
        return False, f"Must wager {rules['wager_requirement']} SC in last 7 days"

    return True, "Eligible"


def calculate_runewager_reward() -> int:
    return SITE_RULES["runewager"]["reward_sc"]


# ============================================================
#  DROPS SYSTEM
# ============================================================

def calculate_drop_reward(site: str, base_sc: int) -> int:
    """Apply site multiplier to base SC."""
    rules = get_site_rules(site)
    validate_sc(base_sc)

    if not rules:
        return base_sc

    multiplier = rules.get("reward_multiplier", 1.0)
    return int(base_sc * multiplier)


# ============================================================
#  RAFFLE LOGIC
# ============================================================

RAFFLE_ENTRY_COST_SC = 1
RAFFLE_DAILY_LIMIT = 100


def can_enter_raffle(sc_balance: int, entries_today: int):
    """Returns (eligible: bool, reason: str)."""
    if sc_balance < RAFFLE_ENTRY_COST_SC:
        return False, "Not enough SC for raffle entry"

    if entries_today >= RAFFLE_DAILY_LIMIT:
        return False, "Daily raffle entry limit reached"

    return True, "Eligible"


def raffle_entry_cost() -> int:
    return RAFFLE_ENTRY_COST_SC


# ============================================================
#  TIME WINDOWS HELPERS
# ============================================================

def within_last_7_days(timestamp: datetime) -> bool:
    """Checks if timestamp is within last 7 days (UTC aware)."""
    if timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=timezone.utc)
    return timestamp >= utc_now() - timedelta(days=7)