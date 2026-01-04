from typing import Tuple, Dict, Optional

from services.db import get_db
from utils.sc import (
    validate_sc,
    eligible_for_runewager_tip,
    calculate_runewager_reward,
    calculate_drop_reward,
    can_enter_raffle,
    raffle_entry_cost,
)


# ============================================================
#  RUNEWAGER TIP LOGIC (DECIDE + LOG, MANUAL TIP OFFSITE)
# ============================================================

async def get_runewager_activity(telegram_id: int) -> Tuple[float, int, bool]:
    """
    Reads Runewager-related history from GCZ DB.

    Assumes tables:
      - runewager_purchases(telegram_id, usd_amount, created_at)
      - runewager_wagers(telegram_id, sc_amount, created_at)
      - runewager_tips(telegram_id, sc_amount, created_at)

    Returns:
      (total_usd_purchases, wager_7d_sc, already_tipped)
    """
    db = await get_db()

    # total purchases (lifetime)
    purchases_row = await db.fetchrow(
        """
        SELECT COALESCE(SUM(usd_amount), 0) AS total_usd
        FROM runewager_purchases
        WHERE telegram_id = $1
        """,
        telegram_id,
    )
    total_usd = float(purchases_row["total_usd"]) if purchases_row else 0.0

    # wagers in last 7 days
    wagers_row = await db.fetchrow(
        """
        SELECT COALESCE(SUM(sc_amount), 0) AS total_sc
        FROM runewager_wagers
        WHERE telegram_id = $1
          AND created_at >= (NOW() - INTERVAL '7 days')
        """,
        telegram_id,
    )
    wager_7d_sc = int(wagers_row["total_sc"]) if wagers_row else 0

    # already tipped?
    tipped_row = await db.fetchrow(
        """
        SELECT 1
        FROM runewager_tips
        WHERE telegram_id = $1
        LIMIT 1
        """,
        telegram_id,
    )
    already_tipped = tipped_row is not None

    await db.close()
    return total_usd, wager_7d_sc, already_tipped


async def check_runewager_tip_eligibility(telegram_id: int) -> Dict:
    """
    Decide if user qualifies for Runewager SC tip.
    Does NOT tip. Used by bot/admin UI.

    Returns:
      {
        telegram_id,
        eligible,
        reason,
        total_usd,
        wager_7d_sc,
        already_tipped,
        reward_sc,
      }
    """
    total_usd, wager_7d_sc, already_tipped = await get_runewager_activity(telegram_id)

    eligible, reason = eligible_for_runewager_tip(
        purchase_total_usd=total_usd,
        wager_last_7_days_sc=wager_7d_sc,
        already_claimed=already_tipped,
    )

    reward_sc = calculate_runewager_reward() if eligible else 0

    return {
        "telegram_id": telegram_id,
        "eligible": eligible,
        "reason": reason,
        "total_usd": total_usd,
        "wager_7d_sc": wager_7d_sc,
        "already_tipped": already_tipped,
        "reward_sc": reward_sc,
    }


async def log_runewager_tip_granted(telegram_id: int, sc_amount: int, admin_id: int) -> None:
    """
    Called AFTER admin manually tips user on Runewager/sweeps site.
    Just logs in GCZ DB to prevent double dips.
    """
    validate_sc(sc_amount)
    db = await get_db()

    await db.execute(
        """
        INSERT INTO runewager_tips (telegram_id, sc_amount, granted_by, created_at)
        VALUES ($1, $2, $3, NOW())
        """,
        telegram_id,
        sc_amount,
        admin_id,
    )

    await db.close()


# ============================================================
#  DROPS / PROMOS (DECIDE + LOG ONLY)
# ============================================================

async def create_drop_log(
    telegram_id: int,
    site: str,
    base_sc: int,
    drop_reason: str,
    admin_id: Optional[int] = None,
) -> Dict:
    """
    Creates a drop log using site-specific multiplier.
    Does NOT send funds, only logs the decision.

    Assumes table:
      drops(telegram_id, site, base_sc, final_sc, reason, admin_id, created_at)
    """
    validate_sc(base_sc)
    final_sc = calculate_drop_reward(site, base_sc)

    db = await get_db()
    await db.execute(
        """
        INSERT INTO drops (telegram_id, site, base_sc, final_sc, reason, admin_id, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        """,
        telegram_id,
        site,
        base_sc,
        final_sc,
        drop_reason,
        admin_id,
    )
    await db.close()

    return {
        "telegram_id": telegram_id,
        "site": site,
        "base_sc": base_sc,
        "final_sc": final_sc,
        "reason": drop_reason,
    }


# ============================================================
#  INTERNAL SC BALANCE + RAFFLE
# ============================================================

async def get_sc_balance(telegram_id: int) -> int:
    """
    Reads internal SC balance from GCZ DB.
    Assumes table: user_balances(telegram_id, sc_balance)
    """
    db = await get_db()
    row = await db.fetchrow(
        """
        SELECT sc_balance
        FROM user_balances
        WHERE telegram_id = $1
        """,
        telegram_id,
    )
    await db.close()

    if not row:
        return 0
    return int(row["sc_balance"])


async def set_sc_balance(telegram_id: int, new_balance: int) -> None:
    """
    Upserts internal SC balance.
    """
    validate_sc(new_balance)
    db = await get_db()
    await db.execute(
        """
        INSERT INTO user_balances (telegram_id, sc_balance)
        VALUES ($1, $2)
        ON CONFLICT (telegram_id) DO UPDATE SET sc_balance = EXCLUDED.sc_balance
        """,
        telegram_id,
        new_balance,
    )
    await db.close()


async def get_daily_raffle_entries(telegram_id: int) -> int:
    """
    Counts how many raffle entries user made today.
    Assumes table: raffle_entries(telegram_id, created_at)
    """
    db = await get_db()
    row = await db.fetchrow(
        """
        SELECT COUNT(*) AS cnt
        FROM raffle_entries
        WHERE telegram_id = $1
          AND DATE(created_at) = CURRENT_DATE
        """,
        telegram_id,
    )
    await db.close()
    return int(row["cnt"]) if row else 0


async def enter_raffle(telegram_id: int) -> Dict:
    """
    Full raffle entry flow:
      - Check internal SC balance
      - Check daily limit
      - Deduct SC
      - Log raffle entry + balance log
    Completely internal to GCZ.
    """
    balance = await get_sc_balance(telegram_id)
    entries_today = await get_daily_raffle_entries(telegram_id)

    eligible, reason = can_enter_raffle(balance, entries_today)
    if not eligible:
        return {
            "success": False,
            "reason": reason,
            "balance": balance,
            "entries_today": entries_today,
        }

    cost = raffle_entry_cost()
    new_balance = balance - cost

    db = await get_db()
    # raffle entry log
    await db.execute(
        """
        INSERT INTO raffle_entries (telegram_id, created_at)
        VALUES ($1, NOW())
        """,
        telegram_id,
    )
    # balance log
    await db.execute(
        """
        INSERT INTO balance_logs (telegram_id, change_sc, reason, created_at)
        VALUES ($1, -$2, 'raffle_entry', NOW())
        """,
        telegram_id,
        cost,
    )
    # update balance
    await db.execute(
        """
        INSERT INTO user_balances (telegram_id, sc_balance)
        VALUES ($1, $2)
        ON CONFLICT (telegram_id) DO UPDATE SET sc_balance = $2
        """,
        telegram_id,
        new_balance,
    )
    await db.close()

    return {
        "success": True,
        "balance_before": balance,
        "balance_after": new_balance,
        "entries_today": entries_today + 1,
        "cost_sc": cost,
    }