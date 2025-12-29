import express from "express";
import pkg from "pg";
const { Pool } = pkg;

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function logAdminAction(req, action, resourceType, resourceId, details = {}) {
  try {
    await pool.query(
      `INSERT INTO admin_audit_log (admin_user, action, resource_type, resource_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.headers["x-admin-user"] || "unknown",
        action,
        resourceType,
        resourceId,
        JSON.stringify(details),
        req.ip || req.connection.remoteAddress,
        req.get("user-agent") || ""
      ]
    );
  } catch (error) {
    console.error("Failed to log admin action:", error);
  }
}

// GET /api/admin/wheel/config - Get wheel configuration
router.get("/config", async (req, res) => {
  try {
    const configResult = await pool.query("SELECT * FROM wheel_config WHERE id = 1");
    if (configResult.rows.length === 0) {
      // Create default config
      const defaultResult = await pool.query(
        `INSERT INTO wheel_config (id, spins_per_day, auto_draw_enabled, prize_slots)
         VALUES (1, 1, false, '[]'::jsonb) RETURNING *`
      );
      return res.json({ config: defaultResult.rows[0], slots: [] });
    }

    const config = configResult.rows[0];
    const slotsResult = await pool.query(
      "SELECT * FROM wheel_prize_slots WHERE wheel_config_id = 1 ORDER BY sort_order"
    );

    res.json({ config, slots: slotsResult.rows });
  } catch (error) {
    console.error("Error fetching wheel config:", error);
    res.status(500).json({ error: "Failed to fetch wheel config" });
  }
});

// PUT /api/admin/wheel/config - Update wheel configuration
router.put("/config", async (req, res) => {
  try {
    const { spins_per_day, target_raffle_id, auto_draw_enabled, auto_draw_frequency, auto_draw_time, prize_slots } = req.body;

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (spins_per_day !== undefined) { updates.push(`spins_per_day = $${paramIndex++}`); params.push(spins_per_day); }
    if (target_raffle_id !== undefined) { updates.push(`target_raffle_id = $${paramIndex++}`); params.push(target_raffle_id); }
    if (auto_draw_enabled !== undefined) { updates.push(`auto_draw_enabled = $${paramIndex++}`); params.push(auto_draw_enabled); }
    if (auto_draw_frequency !== undefined) { updates.push(`auto_draw_frequency = $${paramIndex++}`); params.push(auto_draw_frequency); }
    if (auto_draw_time !== undefined) { updates.push(`auto_draw_time = $${paramIndex++}`); params.push(auto_draw_time); }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(1);

    const result = await pool.query(
      `UPDATE wheel_config SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    // Update prize slots if provided
    if (prize_slots && Array.isArray(prize_slots)) {
      // Delete existing slots
      await pool.query("DELETE FROM wheel_prize_slots WHERE wheel_config_id = 1");
      
      // Insert new slots
      for (const slot of prize_slots) {
        await pool.query(
          `INSERT INTO wheel_prize_slots (wheel_config_id, label, color, entry_multiplier, chance_weight, sort_order)
           VALUES (1, $1, $2, $3, $4, $5)`,
          [slot.label, slot.color, slot.entry_multiplier || 1, slot.chance_weight || 1, slot.sort_order || 0]
        );
      }
    }

    const slotsResult = await pool.query(
      "SELECT * FROM wheel_prize_slots WHERE wheel_config_id = 1 ORDER BY sort_order"
    );

    await logAdminAction(req, "UPDATE", "wheel_config", "1", req.body);
    res.json({ config: result.rows[0], slots: slotsResult.rows });
  } catch (error) {
    console.error("Error updating wheel config:", error);
    res.status(500).json({ error: "Failed to update wheel config" });
  }
});

export default router;
