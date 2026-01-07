import pool from "../../utils/db.js";
import { distributePromoToTelegram } from "../../services/promoTelegram.js";
import { recordTelegramDelivery } from "../../services/dropsPipeline.js";
import { log } from "../utils/logger.js";

export async function listPendingPromos(limit = 5) {
  const result = await pool.query(
    `SELECT id,
            channel,
            content,
            clean_text,
            cleaned_text,
            raw_text,
            created_at
     FROM promos
     WHERE status = 'pending'
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );

  return result.rows;
}

async function fetchPromoWithAffiliate(promoId) {
  const result = await pool.query(
    `SELECT p.*,
            am.name AS affiliate_name,
            am.affiliate_url AS affiliate_url
     FROM promos p
     LEFT JOIN affiliates_master am ON p.affiliate_id = am.id
     WHERE p.id = $1`,
    [promoId]
  );

  return result.rows[0] || null;
}

export async function approvePromo(promoId, reviewer = "telegram_admin") {
  const updated = await pool.query(
    `UPDATE promos
     SET status = 'approved',
         reviewed_by = $2,
         reviewed_at = NOW(),
         approved_by = $2,
         approved_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [promoId, reviewer]
  );

  if (updated.rows.length === 0) {
    return null;
  }

  const promo = await fetchPromoWithAffiliate(promoId);
  if (!promo) return null;

  const sendResult = await distributePromoToTelegram(promo);
  if (sendResult?.ok && sendResult.chatId && sendResult.messageId) {
    await recordTelegramDelivery(promo.id, sendResult.chatId, sendResult.messageId);
  } else {
    log("promos", "Telegram send skipped or failed for approved promo", {
      promo_id: promo.id,
    });
  }

  return promo;
}

