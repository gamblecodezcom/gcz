import tldextract
from services.db import get_db
from logger import get_logger

logger = get_logger("gcz-affiliates-service")


def normalize_bool(v):
    if v in [True, "true", "1", 1, "yes", "y"]:
        return True
    if v in [False, "false", "0", 0, "no", "n"]:
        return False
    return None


def normalize_slug(name: str) -> str:
    return (
        name.lower()
        .strip()
        .replace(" ", "-")
        .replace("_", "-")
    )


async def resolve_domain(url: str) -> str:
    try:
        ext = tldextract.extract(url)
        domain = f"{ext.domain}.{ext.suffix}"
        return domain.lower()
    except Exception as e:
        logger.error(f"[AFFILIATES] Domain resolve failed for {url}: {e}")
        return None


async def generate_icon_url(domain: str) -> str:
    if not domain:
        return None
    return f"https://www.google.com/s2/favicons?domain={domain}&sz=128"


async def upsert_affiliate(row: dict):
    """
    Inserts or updates a single affiliate row into affiliates_master.
    SAFE + DETERMINISTIC + NORMALIZED.
    """

    db = await get_db()

    # -----------------------------------------
    # Normalize + auto-fill missing fields
    # -----------------------------------------
    name = row.get("name")
    affiliate_url = row.get("affiliate_url")
    priority = int(row.get("priority", 0))
    category = row.get("category")
    status = row.get("status")
    level = row.get("level")
    date_added = row.get("date_added")

    bonus_code = row.get("bonus_code")
    bonus_description = row.get("bonus_description")

    # Domain + icon auto-generation
    resolved_domain = row.get("resolved_domain") or await resolve_domain(affiliate_url)
    icon_url = row.get("icon_url") or await generate_icon_url(resolved_domain)

    redemption_speed = row.get("redemption_speed")
    redemption_minimum = row.get("redemption_minimum")
    redemption_type = row.get("redemption_type")

    created_by = row.get("created_by")
    source = row.get("source")
    top_pick = normalize_bool(row.get("top_pick"))
    jurisdiction = row.get("jurisdiction")

    sc_allowed = normalize_bool(row.get("sc_allowed"))
    crypto_allowed = normalize_bool(row.get("crypto_allowed"))
    cwallet_allowed = normalize_bool(row.get("cwallet_allowed"))
    lootbox_allowed = normalize_bool(row.get("lootbox_allowed"))
    show_in_profile = normalize_bool(row.get("show_in_profile"))

    sort_order = row.get("sort_order")
    slug = row.get("slug") or normalize_slug(name)
    description = row.get("description")

    # -----------------------------------------
    # Deterministic parameter order
    # -----------------------------------------
    params = [
        name,
        affiliate_url,
        priority,
        category,
        status,
        level,
        date_added,
        bonus_code,
        bonus_description,
        icon_url,
        resolved_domain,
        redemption_speed,
        redemption_minimum,
        redemption_type,
        created_by,
        source,
        top_pick,
        jurisdiction,
        sc_allowed,
        crypto_allowed,
        cwallet_allowed,
        lootbox_allowed,
        show_in_profile,
        sort_order,
        slug,
        description,
    ]

    # -----------------------------------------
    # Execute upsert
    # -----------------------------------------
    try:
        await db.execute(
            """
            INSERT INTO affiliates_master (
                name, affiliate_url, priority, category, status, level,
                date_added, bonus_code, bonus_description, icon_url,
                resolved_domain, redemption_speed, redemption_minimum,
                redemption_type, created_by, source, top_pick, jurisdiction,
                sc_allowed, crypto_allowed, cwallet_allowed, lootbox_allowed,
                show_in_profile, sort_order, slug, description
            )
            VALUES (
                $1,$2,$3,$4,$5,$6,
                $7,$8,$9,$10,
                $11,$12,$13,
                $14,$15,$16,$17,$18,
                $19,$20,$21,$22,
                $23,$24,$25,$26
            )
            ON CONFLICT (name)
            DO UPDATE SET
                affiliate_url = EXCLUDED.affiliate_url,
                priority = EXCLUDED.priority,
                category = EXCLUDED.category,
                status = EXCLUDED.status,
                level = EXCLUDED.level,
                bonus_code = EXCLUDED.bonus_code,
                bonus_description = EXCLUDED.bonus_description,
                icon_url = EXCLUDED.icon_url,
                resolved_domain = EXCLUDED.resolved_domain,
                redemption_speed = EXCLUDED.redemption_speed,
                redemption_minimum = EXCLUDED.redemption_minimum,
                redemption_type = EXCLUDED.redemption_type,
                top_pick = EXCLUDED.top_pick,
                jurisdiction = EXCLUDED.jurisdiction,
                sc_allowed = EXCLUDED.sc_allowed,
                crypto_allowed = EXCLUDED.crypto_allowed,
                cwallet_allowed = EXCLUDED.cwallet_allowed,
                lootbox_allowed = EXCLUDED.lootbox_allowed,
                show_in_profile = EXCLUDED.show_in_profile,
                sort_order = EXCLUDED.sort_order,
                slug = EXCLUDED.slug,
                description = EXCLUDED.description
            """,
            *params
        )

    except Exception as e:
        logger.error(f"[AFFILIATES] Upsert failed for {name}: {e}")