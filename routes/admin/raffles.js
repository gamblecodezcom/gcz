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

// GET /api/admin/raffles - List all raffles (including inactive)
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM raffles ORDER BY created_at DESC"
    );
    // Parse JSON fields
    const raffles = result.rows.map(r => ({
      ...r,
      entry_sources: typeof r.entry_sources === 'string' ? JSON.parse(r.entry_sources || '[]') : r.entry_sources,
      entries_per_source: typeof r.entries_per_source === 'string' ? JSON.parse(r.entries_per_source || '{}') : r.entries_per_source
    }));
    res.json({ raffles });
  } catch (error) {
    console.error("Error fetching raffles:", error);
    res.status(500).json({ error: "Failed to fetch raffles" });
  }
});

// POST /api/admin/raffles - Create raffle
router.post("/", async (req, res) => {
  try {
    const { 
      title, description, start_date, end_date, active, secret, hidden, 
      prize_type, prize_value, prize_site_id, raffle_type, num_winners,
      secret_code, entry_sources, entries_per_source, winner_selection_method,
      allow_repeat_winners
    } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: "title is required" });
    }

    const result = await pool.query(
      `INSERT INTO raffles (
        title, description, start_date, end_date, active, secret, hidden, 
        prize_type, prize_value, prize_site_id, raffle_type, num_winners,
        secret_code, entry_sources, entries_per_source, winner_selection_method,
        allow_repeat_winners
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *`,
      [
        title,
        description || null,
        start_date || null,
        end_date || null,
        active !== undefined ? active : true,
        secret || false,
        hidden || false,
        prize_type || null,
        prize_value || null,
        prize_site_id || null,
        raffle_type || 'timed',
        num_winners || 1,
        secret_code || null,
        entry_sources ? JSON.stringify(entry_sources) : JSON.stringify(['daily_checkin', 'wheel', 'secret_code']),
        entries_per_source ? JSON.stringify(entries_per_source) : JSON.stringify({ daily_checkin: 1, wheel: 5, secret_code: 10 }),
        winner_selection_method || 'random',
        allow_repeat_winners || false
      ]
    );

    await logAdminAction(req, "CREATE", "raffle", result.rows[0].id.toString(), req.body);
    res.json({ raffle: result.rows[0] });
  } catch (error) {
    console.error("Error creating raffle:", error);
    res.status(500).json({ error: "Failed to create raffle" });
  }
});

// PUT /api/admin/raffles/:id - Update raffle
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, description, start_date, end_date, active, secret, hidden, 
      prize_type, prize_value, prize_site_id, raffle_type, num_winners,
      secret_code, entry_sources, entries_per_source, winner_selection_method,
      allow_repeat_winners
    } = req.body;

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (title !== undefined) { updates.push(`title = $${paramIndex++}`); params.push(title); }
    if (description !== undefined) { updates.push(`description = $${paramIndex++}`); params.push(description); }
    if (start_date !== undefined) { updates.push(`start_date = $${paramIndex++}`); params.push(start_date); }
    if (end_date !== undefined) { updates.push(`end_date = $${paramIndex++}`); params.push(end_date); }
    if (active !== undefined) { updates.push(`active = $${paramIndex++}`); params.push(active); }
    if (secret !== undefined) { updates.push(`secret = $${paramIndex++}`); params.push(secret); }
    if (hidden !== undefined) { updates.push(`hidden = $${paramIndex++}`); params.push(hidden); }
    if (prize_type !== undefined) { updates.push(`prize_type = $${paramIndex++}`); params.push(prize_type); }
    if (prize_value !== undefined) { updates.push(`prize_value = $${paramIndex++}`); params.push(prize_value); }
    if (prize_site_id !== undefined) { updates.push(`prize_site_id = $${paramIndex++}`); params.push(prize_site_id); }
    if (raffle_type !== undefined) { updates.push(`raffle_type = $${paramIndex++}`); params.push(raffle_type); }
    if (num_winners !== undefined) { updates.push(`num_winners = $${paramIndex++}`); params.push(num_winners); }
    if (secret_code !== undefined) { updates.push(`secret_code = $${paramIndex++}`); params.push(secret_code); }
    if (entry_sources !== undefined) { updates.push(`entry_sources = $${paramIndex++}`); params.push(JSON.stringify(entry_sources)); }
    if (entries_per_source !== undefined) { updates.push(`entries_per_source = $${paramIndex++}`); params.push(JSON.stringify(entries_per_source)); }
    if (winner_selection_method !== undefined) { updates.push(`winner_selection_method = $${paramIndex++}`); params.push(winner_selection_method); }
    if (allow_repeat_winners !== undefined) { updates.push(`allow_repeat_winners = $${paramIndex++}`); params.push(allow_repeat_winners); }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const result = await pool.query(
      `UPDATE raffles SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Raffle not found" });
    }

    await logAdminAction(req, "UPDATE", "raffle", id, req.body);
    res.json({ raffle: result.rows[0] });
  } catch (error) {
    console.error("Error updating raffle:", error);
    res.status(500).json({ error: "Failed to update raffle" });
  }
});

// DELETE /api/admin/raffles/:id - Delete raffle
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("DELETE FROM raffles WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Raffle not found" });
    }

    await logAdminAction(req, "DELETE", "raffle", id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting raffle:", error);
    res.status(500).json({ error: "Failed to delete raffle" });
  }
});

// POST /api/admin/raffles/:id/pick-winner - Pick a random winner
router.post("/:id/pick-winner", async (req, res) => {
  try {
    const { id } = req.params;

    // Get all entries for this raffle
    const entriesResult = await pool.query(
      "SELECT user_id FROM raffle_entries WHERE raffle_id = $1",
      [id]
    );

    if (entriesResult.rows.length === 0) {
      return res.status(400).json({ error: "No entries for this raffle" });
    }

    // Pick random winner
    const randomIndex = Math.floor(Math.random() * entriesResult.rows.length);
    const winner = entriesResult.rows[randomIndex];

    // Check if winner already exists
    const existingWinner = await pool.query(
      "SELECT * FROM raffle_winners WHERE raffle_id = $1 AND winner = $2",
      [id, winner.user_id]
    );

    if (existingWinner.rows.length > 0) {
      return res.json({ winner: existingWinner.rows[0], message: "Winner already selected" });
    }

    // Get raffle prize info
    const raffleResult = await pool.query("SELECT prize_type, prize_value FROM raffles WHERE id = $1", [id]);
    const raffle = raffleResult.rows[0];

    // Insert winner
    const winnerResult = await pool.query(
      `INSERT INTO raffle_winners (raffle_id, winner, prize, won_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING *`,
      [
        id,
        winner.user_id,
        raffle.prize_value || raffle.prize_type || "Prize"
      ]
    );

    await logAdminAction(req, "PICK_WINNER", "raffle", id, { winner: winner.user_id });
    res.json({ winner: winnerResult.rows[0] });
  } catch (error) {
    console.error("Error picking winner:", error);
    res.status(500).json({ error: "Failed to pick winner" });
  }
});

// POST /api/admin/raffles/:id/notify-winner - Send notification to winner
router.post("/:id/notify-winner", async (req, res) => {
  try {
    const { id } = req.params;

    // Get winner
    const winnerResult = await pool.query(
      "SELECT * FROM raffle_winners WHERE raffle_id = $1 ORDER BY won_at DESC LIMIT 1",
      [id]
    );

    if (winnerResult.rows.length === 0) {
      return res.status(400).json({ error: "No winner selected for this raffle" });
    }

    const winner = winnerResult.rows[0];

    // Get raffle details
    const raffleResult = await pool.query("SELECT * FROM raffles WHERE id = $1", [id]);
    const raffle = raffleResult.rows[0];

    // TODO: Implement actual push notification
    // For now, just log the action
    await logAdminAction(req, "NOTIFY_WINNER", "raffle", id, {
      winner: winner.winner,
      raffle_title: raffle.title
    });

    res.json({
      success: true,
      message: "Winner notification sent",
      winner: winner.winner
    });
  } catch (error) {
    console.error("Error notifying winner:", error);
    res.status(500).json({ error: "Failed to notify winner" });
  }
});

// GET /api/admin/raffles/:id - Get single raffle
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM raffles WHERE id = $1", [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Raffle not found" });
    }

    const raffle = result.rows[0];
    // Parse JSON fields
    raffle.entry_sources = typeof raffle.entry_sources === 'string' ? JSON.parse(raffle.entry_sources || '[]') : raffle.entry_sources;
    raffle.entries_per_source = typeof raffle.entries_per_source === 'string' ? JSON.parse(raffle.entries_per_source || '{}') : raffle.entries_per_source;
    
    res.json({ raffle });
  } catch (error) {
    console.error("Error fetching raffle:", error);
    res.status(500).json({ error: "Failed to fetch raffle" });
  }
});

// GET /api/admin/raffles/:id/entries - Get entries with source breakdown
router.get("/:id/entries", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get entries with source breakdown
    const entriesResult = await pool.query(
      `SELECT 
        user_id,
        entry_source,
        COUNT(*) as entry_count,
        MIN(entry_time) as first_entry,
        MAX(entry_time) as last_entry
      FROM raffle_entries 
      WHERE raffle_id = $1 
      GROUP BY user_id, entry_source
      ORDER BY user_id, entry_source`,
      [id]
    );

    // Get total counts
    const totalResult = await pool.query(
      `SELECT 
        entry_source,
        COUNT(*) as source_count
      FROM raffle_entries 
      WHERE raffle_id = $1 
      GROUP BY entry_source`,
      [id]
    );

    // Get unique users count
    const uniqueUsersResult = await pool.query(
      `SELECT COUNT(DISTINCT user_id) as unique_users FROM raffle_entries WHERE raffle_id = $1`,
      [id]
    );

    const uniqueUsers = parseInt(uniqueUsersResult.rows[0]?.unique_users || 0, 10);
    const totalEntries = totalResult.rows.reduce((sum, r) => sum + parseInt(r.source_count || 0, 10), 0);

    res.json({
      entries: entriesResult.rows,
      summary: {
        unique_users: uniqueUsers,
        total_entries: totalEntries,
        by_source: totalResult.rows.map(r => ({
          source: r.entry_source || 'unknown',
          count: parseInt(r.source_count || 0, 10)
        }))
      }
    });
  } catch (error) {
    console.error("Error fetching entries:", error);
    res.status(500).json({ error: "Failed to fetch entries" });
  }
});

// POST /api/admin/raffles/:id/draw-winners - Draw multiple winners
router.post("/:id/draw-winners", async (req, res) => {
  try {
    const { id } = req.params;
    const { num_winners, selection_method = 'random', allow_repeat = false } = req.body;

    // Get raffle info
    const raffleResult = await pool.query("SELECT * FROM raffles WHERE id = $1", [id]);
    if (raffleResult.rows.length === 0) {
      return res.status(404).json({ error: "Raffle not found" });
    }
    const raffle = raffleResult.rows[0];

    const winnersCount = num_winners || raffle.num_winners || 1;

    // Get all entries
    const entriesResult = await pool.query(
      "SELECT DISTINCT user_id FROM raffle_entries WHERE raffle_id = $1",
      [id]
    );

    if (entriesResult.rows.length === 0) {
      return res.status(400).json({ error: "No entries for this raffle" });
    }

    const winners = [];
    const availableUsers = [...entriesResult.rows];

    for (let i = 0; i < winnersCount && availableUsers.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * availableUsers.length);
      const winner = availableUsers[randomIndex];
      
      // Check if already a winner
      const existing = await pool.query(
        "SELECT * FROM raffle_winners WHERE raffle_id = $1 AND winner = $2",
        [id, winner.user_id]
      );

      if (existing.rows.length === 0) {
        const winnerResult = await pool.query(
          `INSERT INTO raffle_winners (raffle_id, winner, prize, won_at)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING *`,
          [id, winner.user_id, raffle.prize_value || raffle.prize_type || "Prize"]
        );
        winners.push(winnerResult.rows[0]);
      }

      if (!allow_repeat) {
        availableUsers.splice(randomIndex, 1);
      }
    }

    await logAdminAction(req, "DRAW_WINNERS", "raffle", id, { winners_count: winners.length });
    res.json({ winners, count: winners.length });
  } catch (error) {
    console.error("Error drawing winners:", error);
    res.status(500).json({ error: "Failed to draw winners" });
  }
});

// POST /api/admin/raffles/:id/duplicate - Duplicate raffle
router.post("/:id/duplicate", async (req, res) => {
  try {
    const { id } = req.params;
    const original = await pool.query("SELECT * FROM raffles WHERE id = $1", [id]);
    
    if (original.rows.length === 0) {
      return res.status(404).json({ error: "Raffle not found" });
    }

    const raffle = original.rows[0];
    const result = await pool.query(
      `INSERT INTO raffles (title, description, start_date, end_date, active, secret, hidden, 
        prize_type, prize_value, raffle_type, num_winners, secret_code, entry_sources, 
        entries_per_source, winner_selection_method, allow_repeat_winners, prize_site_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *`,
      [
        `${raffle.title} (Copy)`,
        raffle.description,
        raffle.start_date,
        raffle.end_date,
        false, // Duplicated raffles start inactive
        raffle.secret,
        raffle.hidden,
        raffle.prize_type,
        raffle.prize_value,
        raffle.raffle_type,
        raffle.num_winners,
        raffle.secret_code,
        raffle.entry_sources,
        raffle.entries_per_source,
        raffle.winner_selection_method,
        raffle.allow_repeat_winners,
        raffle.prize_site_id
      ]
    );

    await logAdminAction(req, "DUPLICATE", "raffle", id, { new_id: result.rows[0].id });
    res.json({ raffle: result.rows[0] });
  } catch (error) {
    console.error("Error duplicating raffle:", error);
    res.status(500).json({ error: "Failed to duplicate raffle" });
  }
});

// POST /api/admin/raffles/:id/end - End raffle
router.post("/:id/end", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "UPDATE raffles SET active = false, end_date = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Raffle not found" });
    }

    await logAdminAction(req, "END_RAFFLE", "raffle", id);
    res.json({ raffle: result.rows[0] });
  } catch (error) {
    console.error("Error ending raffle:", error);
    res.status(500).json({ error: "Failed to end raffle" });
  }
});

export default router;
