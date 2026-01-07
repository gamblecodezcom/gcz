import pool from "../utils/db.js";
import logger from "../utils/logger.js";

let cachedColumns = null;
let hasPromoAiLog = null;

async function loadPromoColumns() {
  if (cachedColumns) return cachedColumns;

  try {
    const result = await pool.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'promos'`
    );

    cachedColumns = new Set(result.rows.map((row) => row.column_name));
  } catch (err) {
    logger.warn("promo-store", "Failed to read promos schema", err);
    cachedColumns = new Set();
  }

  return cachedColumns;
}

function pickColumns(columns, payload) {
  const entries = Object.entries(payload).filter(([key]) => columns.has(key));
  const keys = entries.map(([key]) => key);
  const values = entries.map(([, value]) => value);
  return { keys, values };
}

async function ensurePromoAiLogTable() {
  if (hasPromoAiLog !== null) return hasPromoAiLog;

  try {
    const result = await pool.query(
      "SELECT to_regclass('public.promo_ai_log') AS reg"
    );
    hasPromoAiLog = Boolean(result.rows[0]?.reg);
  } catch (err) {
    logger.warn("promo-store", "Failed to check promo_ai_log table", err);
    hasPromoAiLog = false;
  }

  return hasPromoAiLog;
}

export async function insertPromo(payload) {
  const columns = await loadPromoColumns();
  const { keys, values } = pickColumns(columns, payload);

  if (keys.length === 0) {
    throw new Error("Promos table has no compatible columns");
  }

  const placeholders = keys.map((_, idx) => `$${idx + 1}`);
  const query = `INSERT INTO promos (${keys.join(", ")})
                 VALUES (${placeholders.join(", ")})
                 RETURNING *`;

  const result = await pool.query(query, values);
  return result.rows[0];
}

export async function updatePromo(promoId, payload) {
  const columns = await loadPromoColumns();
  const { keys, values } = pickColumns(columns, payload);

  if (keys.length === 0) {
    return null;
  }

  const assignments = keys.map((key, idx) => `${key} = $${idx + 1}`);
  const query = `UPDATE promos
                 SET ${assignments.join(", ")}
                 WHERE id = $${keys.length + 1}
                 RETURNING *`;

  const result = await pool.query(query, [...values, promoId]);
  return result.rows[0] || null;
}

export async function insertPromoAiLog(payload) {
  const available = await ensurePromoAiLogTable();
  if (!available) return null;

  try {
    const result = await pool.query(
      `INSERT INTO promo_ai_log
         (promo_id, ai_model, ai_label, ai_confidence, ai_raw_response, admin_action, admin_reason, admin_corrected_text)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        payload.promo_id,
        payload.ai_model,
        payload.ai_label,
        payload.ai_confidence,
        payload.ai_raw_response,
        payload.admin_action,
        payload.admin_reason,
        payload.admin_corrected_text,
      ]
    );
    return result;
  } catch (err) {
    logger.warn("promo-store", "Failed to insert promo_ai_log", err);
    return null;
  }
}
