import express from "express";
import pkg from "pg";
const { Pool } = pkg;
import superAdminOnly from "../../middleware/superAdminOnly.js";

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
      `SELECT r.*, 
        (SELECT COUNT(*) FROM raffle_winners WHERE raffle_id = r.id) as winners_count
       FROM raffles r 
       ORDER BY r.created_at DESC`
    );
    // Parse JSON fields
    const raffles = result.rows.map(r => ({
      ...r,
      entry_sources: typeof r.entry_sources === 'string' ? JSON.parse(r.entry_sources || '[]') : r.entry_sources,
      entries_per_source: typeof r.entries_per_source === 'string' ? JSON.parse(r.entries_per_source || '{}') : r.entries_per_source,
      winners_count: parseInt(r.winners_count || 0, 10)
    }));
    res.json({ raffles });
  } catch (error) {
    console.error("Error fetching raffles:", error);
    res.status(500).json({ error: "Failed to fetch raffles" });
  }
});

// POST /api/admin/raffles - Create raffle (Super Admin only)
router.post("/", superAdminOnly, async (req, res) => {
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

// PUT /api/admin/raffles/:id - Update raffle (Super Admin only)
router.put("/:id", superAdminOnly, async (req, res) => {
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

// DELETE /api/admin/raffles/:id - Delete raffle (Super Admin only)
router.delete("/:id", superAdminOnly, async (req, res) => {
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

// POST /api/admin/raffles/:id/pick-winners - Pick winners (Super Admin only)
// This is the main winner selection endpoint that handles both endless and preloaded URL raffles
router.post("/:id/pick-winners", superAdminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      num_winners: overrideNumWinners, 
      prize_type: overridePrizeType,
      prize_value: overridePrizeValue,
      urls: providedUrls // For endless raffles
    } = req.body;

    // Get raffle info
    const raffleResult = await pool.query(
      `SELECT id, title, raffle_type, num_winners, prize_type, prize_value, 
              winner_selection_method, allow_repeat_winners, active, hidden
       FROM raffles WHERE id = $1`,
      [id]
    );

    if (raffleResult.rows.length === 0) {
      return res.status(404).json({ error: "Raffle not found" });
    }

    const raffle = raffleResult.rows[0];
    const selectionMethod = raffle.winner_selection_method || 'random';
    
    // Only support random for now
    if (selectionMethod !== 'random') {
      return res.status(400).json({ error: `Winner selection method '${selectionMethod}' is not implemented` });
    }

    // Get all entries (each row is one ticket)
    const entriesResult = await pool.query(
      `SELECT user_id, source 
       FROM raffle_entries 
       WHERE raffle_id = $1`,
      [id]
    );

    if (entriesResult.rows.length === 0) {
      return res.status(400).json({ error: "No entries for this raffle" });
    }

    const numWinners = overrideNumWinners || raffle.num_winners || 1;
    const allowRepeat = raffle.allow_repeat_winners || false;

    // Determine if this is an endless raffle (manual type)
    // Endless raffles are manual type and may be hidden or visible
    const isEndlessRaffle = raffle.raffle_type === 'manual';

    // For endless raffles, require URLs to be provided
    if (isEndlessRaffle) {
      if (!providedUrls || !Array.isArray(providedUrls) || providedUrls.length !== numWinners) {
        return res.status(400).json({ 
          error: `For endless raffles, exactly ${numWinners} URLs must be provided`,
          required: numWinners,
          provided: providedUrls ? providedUrls.length : 0
        });
      }

      if (!overridePrizeType || !overridePrizeValue) {
        return res.status(400).json({ 
          error: "For endless raffles, prize_type and prize_value must be provided" 
        });
      }
    } else {
      // For preloaded URL raffles, check if URLs exist
      const urlCountResult = await pool.query(
        `SELECT COUNT(*) as count FROM raffle_prize_urls 
         WHERE raffle_id = $1 AND used = false`,
        [id]
      );
      const availableUrls = parseInt(urlCountResult.rows[0]?.count || 0, 10);
      
      if (raffle.prize_type === 'crypto_box' && availableUrls < numWinners) {
        return res.status(400).json({ 
          error: `Not enough unused URLs. Required: ${numWinners}, Available: ${availableUrls}` 
        });
      }
    }

    // Pick winners using random selection
    // Each entry in raffle_entries is one ticket
    const allTickets = entriesResult.rows.map(e => e.user_id);
    
    if (allTickets.length === 0) {
      return res.status(400).json({ error: "No entries available" });
    }

    const winners = [];
    const usedUserIds = new Set();
    const availableTickets = [...allTickets];

    // Pick distinct winners if allow_repeat_winners is false
    while (winners.length < numWinners && availableTickets.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableTickets.length);
      const selectedUserId = availableTickets[randomIndex];

      // If repeats not allowed, ensure distinct users
      if (!allowRepeat && usedUserIds.has(selectedUserId)) {
        // Remove this ticket and try again
        availableTickets.splice(randomIndex, 1);
        continue;
      }

      // Check if user is already a winner (for this specific draw)
      const existingWinner = await pool.query(
        "SELECT * FROM raffle_winners WHERE raffle_id = $1 AND user_id = $2",
        [id, selectedUserId]
      );

      if (existingWinner.rows.length > 0 && !allowRepeat) {
        // Remove this ticket and try again
        availableTickets.splice(randomIndex, 1);
        continue;
      }

      winners.push(selectedUserId);
      usedUserIds.add(selectedUserId);

      // If repeats not allowed, remove all tickets for this user
      if (!allowRepeat) {
        for (let i = availableTickets.length - 1; i >= 0; i--) {
          if (availableTickets[i] === selectedUserId) {
            availableTickets.splice(i, 1);
          }
        }
      } else {
        // Remove just this one ticket
        availableTickets.splice(randomIndex, 1);
      }
    }

    if (winners.length < numWinners) {
      return res.status(400).json({ 
        error: `Could only pick ${winners.length} distinct winners out of ${numWinners} requested`,
        winnersPicked: winners.length,
        requested: numWinners
      });
    }

    // Assign URLs and create winner records
    const winnerRecords = [];
    const prizeType = overridePrizeType || raffle.prize_type;
    const prizeValue = overridePrizeValue || raffle.prize_value;

    for (let i = 0; i < winners.length; i++) {
      const userId = winners[i];
      let claimUrl = null;

      if (isEndlessRaffle) {
        // Use provided URLs
        claimUrl = providedUrls[i];
      } else if (raffle.prize_type === 'crypto_box') {
        // Get unused URL from raffle_prize_urls
        const urlResult = await pool.query(
          `UPDATE raffle_prize_urls 
           SET used = true, assigned_to_user_id = $1
           WHERE id = (
             SELECT id FROM raffle_prize_urls 
             WHERE raffle_id = $2 AND used = false 
             LIMIT 1 FOR UPDATE SKIP LOCKED
           )
           RETURNING url`,
          [userId, id]
        );

        if (urlResult.rows.length === 0) {
          return res.status(500).json({ 
            error: `Failed to assign URL to winner ${userId}` 
          });
        }

        claimUrl = urlResult.rows[0].url;
      }

      // Insert winner record
      const winnerResult = await pool.query(
        `INSERT INTO raffle_winners (raffle_id, user_id, prize_type, cwallet_claim_url, assigned_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING *`,
        [id, userId, prizeType, claimUrl]
      );

      winnerRecords.push(winnerResult.rows[0]);
    }

    // Mark raffle as inactive
    await pool.query(
      "UPDATE raffles SET active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [id]
    );

    // For endless raffles, create the next endless raffle
    if (isEndlessRaffle) {
      await pool.query(
        `INSERT INTO raffles (
          title, description, active, hidden, raffle_type, 
          allow_repeat_winners, num_winners, prize_type, prize_value,
          start_date, end_date, entry_sources, entries_per_source, winner_selection_method
        ) VALUES (
          'Endless Raffle', 'Primary endless raffle', false, true, 'manual',
          true, 1, NULL, NULL,
          NULL, NULL,
          '["daily_checkin", "wheel", "secret_code", "manual"]'::jsonb,
          '{"wheel": 5, "manual": 0, "secret_code": 10, "daily_checkin": 1}'::jsonb,
          'random'
        )`
      );
    }

    await logAdminAction(req, "PICK_WINNERS", "raffle", id, { 
      winners: winners,
      num_winners: winners.length,
      method: selectionMethod,
      is_endless: isEndlessRaffle
    });

    res.json({ 
      winners: winnerRecords,
      count: winnerRecords.length,
      raffle_id: id
    });
  } catch (error) {
    console.error("Error picking winners:", error);
    res.status(500).json({ error: "Failed to pick winners", message: error.message });
  }
});

// Legacy endpoint - redirects to new pick-winners
router.post("/:id/pick-winner", superAdminOnly, async (req, res) => {
  req.url = req.url.replace('/pick-winner', '/pick-winners');
  router.handle(req, res);
});

// POST /api/admin/raffles/:id/notify-winner - Send notification to winner (Super Admin only)
router.post("/:id/notify-winner", superAdminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    // Get winner
    const winnerResult = await pool.query(
      "SELECT * FROM raffle_winners WHERE raffle_id = $1 ORDER BY assigned_at DESC LIMIT 1",
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
      winner: winner.user_id,
      raffle_title: raffle.title
    });

    res.json({
      success: true,
      message: "Winner notification sent",
      winner: winner.user_id
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
        source,
        COUNT(*) as entry_count,
        MIN(created_at) as first_entry,
        MAX(created_at) as last_entry
      FROM raffle_entries 
      WHERE raffle_id = $1 
      GROUP BY user_id, source
      ORDER BY user_id, source`,
      [id]
    );

    // Get total counts
    const totalResult = await pool.query(
      `SELECT 
        source,
        COUNT(*) as source_count
      FROM raffle_entries 
      WHERE raffle_id = $1 
      GROUP BY source`,
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
          source: r.source || 'unknown',
          count: parseInt(r.source_count || 0, 10)
        }))
      }
    });
  } catch (error) {
    console.error("Error fetching entries:", error);
    res.status(500).json({ error: "Failed to fetch entries" });
  }
});

// Legacy endpoint - redirects to new pick-winners
router.post("/:id/draw-winners", superAdminOnly, async (req, res) => {
  req.url = req.url.replace('/draw-winners', '/pick-winners');
  router.handle(req, res);
});

// POST /api/admin/raffles/:id/duplicate - Duplicate raffle (Super Admin only)
router.post("/:id/duplicate", superAdminOnly, async (req, res) => {
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

// POST /api/admin/raffles/:id/end - End raffle (Super Admin only)
router.post("/:id/end", superAdminOnly, async (req, res) => {
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

// GET /api/admin/raffles/:id/prize-urls - Get prize URLs for a raffle
router.get("/:id/prize-urls", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, url, used, assigned_to_user_id, created_at
       FROM raffle_prize_urls 
       WHERE raffle_id = $1 
       ORDER BY created_at DESC`,
      [id]
    );
    res.json({ urls: result.rows });
  } catch (error) {
    console.error("Error fetching prize URLs:", error);
    res.status(500).json({ error: "Failed to fetch prize URLs" });
  }
});

// POST /api/admin/raffles/:id/prize-urls - Add prize URLs (Super Admin only)
router.post("/:id/prize-urls", superAdminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { urls } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: "URLs array is required" });
    }

    const insertPromises = urls.map(url =>
      pool.query(
        `INSERT INTO raffle_prize_urls (raffle_id, url, used, created_at)
         VALUES ($1, $2, false, CURRENT_TIMESTAMP)`,
        [id, url]
      )
    );

    await Promise.all(insertPromises);

    await logAdminAction(req, "ADD_PRIZE_URLS", "raffle", id, { count: urls.length });
    res.json({ success: true, count: urls.length });
  } catch (error) {
    console.error("Error adding prize URLs:", error);
    res.status(500).json({ error: "Failed to add prize URLs" });
  }
});

// DELETE /api/admin/raffles/:id/prize-urls/:urlId - Delete a prize URL (Super Admin only)
router.delete("/:id/prize-urls/:urlId", superAdminOnly, async (req, res) => {
  try {
    const { id, urlId } = req.params;

    const result = await pool.query(
      "DELETE FROM raffle_prize_urls WHERE id = $1 AND raffle_id = $2 AND used = false RETURNING *",
      [urlId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "URL not found or already used" });
    }

    await logAdminAction(req, "DELETE_PRIZE_URL", "raffle", id, { url_id: urlId });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting prize URL:", error);
    res.status(500).json({ error: "Failed to delete prize URL" });
  }
});

// POST /api/admin/raffles/:id/activate - Activate endless raffle (Super Admin only)
router.post("/:id/activate", superAdminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE raffles 
       SET active = true, hidden = false, start_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND raffle_type = 'manual' 
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Raffle not found or not a manual raffle" });
    }

    await logAdminAction(req, "ACTIVATE_ENDLESS_RAFFLE", "raffle", id);
    res.json({ raffle: result.rows[0] });
  } catch (error) {
    console.error("Error activating raffle:", error);
    res.status(500).json({ error: "Failed to activate raffle" });
  }
});

// GET /api/admin/raffles/:id/detail - Get detailed raffle info including entries, winners, and URLs
router.get("/:id/detail", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get raffle
    const raffleResult = await pool.query("SELECT * FROM raffles WHERE id = $1", [id]);
    if (raffleResult.rows.length === 0) {
      return res.status(404).json({ error: "Raffle not found" });
    }
    
    const raffle = raffleResult.rows[0];
    raffle.entry_sources = typeof raffle.entry_sources === 'string' ? JSON.parse(raffle.entry_sources || '[]') : raffle.entry_sources;
    raffle.entries_per_source = typeof raffle.entries_per_source === 'string' ? JSON.parse(raffle.entries_per_source || '{}') : raffle.entries_per_source;

    // Get entries count
    const entriesCount = await pool.query(
      "SELECT COUNT(*) as count FROM raffle_entries WHERE raffle_id = $1",
      [id]
    );

    // Get winners
    const winnersResult = await pool.query(
      `SELECT id, user_id, prize_type, cwallet_claim_url, assigned_at
       FROM raffle_winners 
       WHERE raffle_id = $1 
       ORDER BY assigned_at DESC`,
      [id]
    );

    // Get prize URLs
    const urlsResult = await pool.query(
      `SELECT id, url, used, assigned_to_user_id, created_at
       FROM raffle_prize_urls 
       WHERE raffle_id = $1 
       ORDER BY created_at DESC`,
      [id]
    );

    res.json({
      raffle,
      entries_count: parseInt(entriesCount.rows[0]?.count || 0, 10),
      winners: winnersResult.rows,
      prize_urls: urlsResult.rows
    });
  } catch (error) {
    console.error("Error fetching raffle detail:", error);
    res.status(500).json({ error: "Failed to fetch raffle detail" });
  }
});

export default router;
