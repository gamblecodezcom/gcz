import pool from "../utils/db.js";
import logger from "../utils/logger.js";
import { distributePromoToTelegram } from "./promoTelegram.js";

async function hasTelegramLinksTable() {
  try {
    const result = await pool.query(
      "SELECT to_regclass('public.telegram_promo_links') AS reg"
    );
    return Boolean(result.rows[0]?.reg);
  } catch (err) {
    logger.warn("drops-pipeline", "Failed to check telegram_promo_links table", err);
    return false;
  }
}

async function listApprovedPromos(limit) {
  const useTelegramLinks = await hasTelegramLinksTable();
  const params = [limit];

  if (useTelegramLinks) {
    const result = await pool.query(
      `SELECT p.*,
              am.name AS affiliate_name,
              am.affiliate_url AS affiliate_url
       FROM promos p
       LEFT JOIN affiliates_master am ON p.affiliate_id = am.id
       LEFT JOIN telegram_promo_links tpl ON tpl.promo_id = p.id
       WHERE p.status = 'approved'
         AND tpl.promo_id IS NULL
       ORDER BY p.reviewed_at DESC NULLS LAST, p.created_at DESC
       LIMIT $1`,
      params
    );
    return result.rows;
  }

  logger.warn(
    "drops-pipeline",
    "telegram_promo_links missing; skipping approved promo distribution"
  );
  return [];
}

export async function recordTelegramDelivery(promoId, chatId, messageId) {
  const useTelegramLinks = await hasTelegramLinksTable();
  if (!useTelegramLinks) return false;

  await pool.query(
    `INSERT INTO telegram_promo_links (promo_id, chat_id, message_id)
     VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING`,
    [promoId, chatId, messageId]
  );

  return true;
}

export async function processApprovedPromos(options = {}) {
  const limit = Number.isFinite(options.limit) ? options.limit : 25;
  const dryRun = Boolean(options.dryRun);

  const promos = await listApprovedPromos(limit);
  if (promos.length === 0) {
    logger.info("drops-pipeline", "No approved promos pending");
    return { processed: 0, sent: 0 };
  }

  let sent = 0;

  for (const promo of promos) {
    const summary = {
      promo_id: promo.id,
      channel: promo.channel,
      source: promo.source,
    };

    if (dryRun) {
      logger.info("drops-pipeline", "Dry run - skipping send", summary);
      continue;
    }

    const result = await distributePromoToTelegram(promo);
    if (!result?.ok) {
      logger.warn("drops-pipeline", "Telegram send failed", summary);
      continue;
    }

    if (result.messageId && result.chatId) {
      await recordTelegramDelivery(promo.id, result.chatId, result.messageId);
    }

    sent += 1;
  }

  logger.info("drops-pipeline", "Pipeline run complete", {
    processed: promos.length,
    sent,
  });

  return { processed: promos.length, sent };
}
