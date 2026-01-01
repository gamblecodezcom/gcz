import pool from "../utils/db.js";

export async function listPendingPromos() {
  const result = await pool.query(
    `SELECT * FROM promos WHERE status = 'pending' ORDER BY created_at DESC`
  );
  return result.rows;
}

export async function approvePromo(promoId, adminId) {
  const result = await pool.query(
    `UPDATE promos
     SET status = 'approved',
         approved_by = $2,
         approved_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [promoId, adminId]
  );

  return result.rows[0];
}
