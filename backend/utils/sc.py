from datetime import datetime, timedelta


# ============================================================
#  BASIC CONSTANTS
# ============================================================

# Core rule: $1 USD = 1 SC
USD_TO_SC_RATE = 1        # $1 = 1 SC
SC_TO_USD_RATE = 1        # 1 SC = $1

MIN_SC = 0
MAX_SC = 1_000_000_000    # safety cap


# ============================================================
#  BASIC CONVERSIONS
# ============================================================

def usd_to_sc(usd: float) -> int:
    """
    Convert USD to SC using 1:1 ratio.
    Example:
      usd_to_sc(1.0)   -> 1
      usd_to_sc(100.0) -> 100
    """
    return int(usd * USD_TO_SC_RATE)


def sc_to_usd(sc: int) -> float:
    """
    Convert SC to USD using 1:1 ratio.
    Example:
      sc_to_usd(1)   -> 1.0
      sc_to_usd(100) -> 100.0
    """
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
    """
    Format SC as a human-readable string.
    Example:
      format_sc(3000) -> "3,000 SC"
    """
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

"""
SITE_RULES defines how each partner behaves in SC logic.

- runewager:
    - We’re tracking an SC tip campaign:
        - minimum $10 purchase
        - 3000 SC wager in last 7 days
        - 30 SC one-time tip if eligible

- winna / cwallet:
    - reward_multiplier can boost drops/promos if you want.
"""

SITE_RULES = {
    "runewager": {
        "type": "sc",
        "min_purchase_usd": 10,    # $10 minimum purchase
        "wager_requirement": 3000, # 3000 SC in last 7 days
        "reward_sc": 30,           # 30 SC tip
        "limit_once": True,        # one-time per user
    },
    "winna": {
        "type": "sweeps",
        "reward_multiplier": 1.0,  # change if you want winna boosted
    },
    "cwallet": {
        "type": "crypto",
        "reward_multiplier": 1.0,  # change if you want cwallet boosted
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
    """
    Decide if a user qualifies for the Runewager SC tip.
    This does NOT send anything, it only decides.

    Returns:
      (eligible: bool, reason: str)
    """
    rules = SITE_RULES["runewager"]

    if already_claimed and rules["limit_once"]:
        return False, "Already claimed Runewager SC tip"

    if purchase_total_usd < rules["min_purchase_usd"]:
        return False, f"Minimum ${rules['min_purchase_usd']} in purchases required"

    if wager_last_7_days_sc < rules["wager_requirement"]:
        return False, f"Must wager {rules['wager_requirement']} SC in last 7 days"

    return True, "Eligible"


def calculate_runewager_reward() -> int:
    """
    Returns configured Runewager SC tip amount.
    """
    return SITE_RULES["runewager"]["reward_sc"]


# ============================================================
#  DROPS SYSTEM (SWEPS / PROMOS)
# ============================================================

def calculate_drop_reward(site: str, base_sc: int) -> int:
    """
    Compute final SC for a drop, based on site multiplier.
    Admin still tips manually on external site – this only decides/logs.

    Example:
      base_sc = 10
      site = "winna" with multiplier 1.2 -> 12 SC
    """
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
    """
    Decide if user can enter SC raffle.
    Returns (eligible: bool, reason: str)
    """
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
    return timestamp >= datetime.utcnow() - timedelta(days=7)