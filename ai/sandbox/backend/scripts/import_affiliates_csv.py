import csv
from services.affiliates_service import resolve_domain, generate_icon_url, upsert_affiliate
from backend.logger import get_logger

CSV_PATH = "/var/www/html/gcz/master_affiliates.csv"
logger = get_logger("gcz-affiliates-import")


async def import_affiliates():
    """
    Reads master_affiliates.csv and syncs into affiliates_master table.
    """
    try:
        with open(CSV_PATH, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)

            for row in reader:
                domain = await resolve_domain(row["affiliate_url"])
                icon = await generate_icon_url(domain)

                row["resolved_domain"] = domain
                row["icon_url"] = icon

                await upsert_affiliate(row)

        logger.info("[AFFILIATES] CSV import completed successfully")

    except Exception as e:
        logger.error(f"[AFFILIATES] CSV import failed: {e}")