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

// OVERVIEW

// GET /api/admin/telegram-bot/overview - Get bot overview
router.get("/overview", async (req, res) => {
  try {
    // Bot status (check if bot is configured and running)
    const botStatus = process.env.TELEGRAM_BOT_TOKEN ? "online" : "error";
    const botUsername = process.env.TELEGRAM_BOT_USERNAME || "N/A";
    const channels = process.env.TELEGRAM_CHANNEL_IDS ? process.env.TELEGRAM_CHANNEL_IDS.split(",") : [];

    // Connected users count
    const connectedUsers = await pool.query(
      "SELECT COUNT(*) FROM users WHERE telegram_id IS NOT NULL"
    );

    // Command usage stats
    const commandUsage = await pool.query(
      `SELECT command, COUNT(*) as count
       FROM telegram_logs
       WHERE type = 'command'
       GROUP BY command`
    );

    const usageMap = {};
    commandUsage.rows.forEach(row => {
      usageMap[row.command] = parseInt(row.count);
    });

    // Recent broadcasts
    const recentBroadcasts = await pool.query(
      `SELECT message, delivered, failed, clicks, created_at
       FROM telegram_broadcasts
       ORDER BY created_at DESC
       LIMIT 10`
    );

    res.json({
      bot_status: botStatus,
      bot_username: botUsername,
      channels: channels,
      connected_users: parseInt(connectedUsers.rows[0].count),
      command_usage: {
        start: usageMap['/start'] || 0,
        link: usageMap['/link'] || 0,
        raffles: usageMap['/raffles'] || 0,
        wheel: usageMap['/wheel'] || 0,
        code: usageMap['/code'] || 0
      },
      recent_broadcasts: recentBroadcasts.rows
    });
  } catch (error) {
    console.error("Error fetching overview:", error);
    res.status(500).json({ error: "Failed to fetch overview" });
  }
});

// COMMANDS

// GET /api/admin/telegram-bot/commands - List commands
router.get("/commands", async (req, res) => {
  try {
    const commands = [
      { id: 1, command: 'start', description: 'Greet user and link account', enabled: true },
      { id: 2, command: 'link', description: 'Resend linking instructions', enabled: true },
      { id: 3, command: 'profile', description: 'Show user stats', enabled: true },
      { id: 4, command: 'raffles', description: 'List active raffles', enabled: true },
      { id: 5, command: 'wheel', description: 'Show spins left', enabled: true },
      { id: 6, command: 'code', description: 'Submit secret code', enabled: true }
    ];

    // Get usage counts
    for (const cmd of commands) {
      const result = await pool.query(
        "SELECT COUNT(*) FROM telegram_logs WHERE type = 'command' AND command = $1",
        [`/${cmd.command}`]
      );
      cmd.usage_count = parseInt(result.rows[0].count);
    }

    res.json({ commands });
  } catch (error) {
    console.error("Error fetching commands:", error);
    res.status(500).json({ error: "Failed to fetch commands" });
  }
});

// PUT /api/admin/telegram-bot/commands/:id - Toggle command enabled/disabled
router.put("/commands/:id", async (req, res) => {
  try {
    const { enabled } = req.body;
    const commandId = parseInt(req.params.id);

    // In a real implementation, you'd store this in a database table
    // For now, we'll just log the action
    await logAdminAction(req, "UPDATE", "telegram_commands", commandId, { enabled });

    res.json({ success: true, enabled });
  } catch (error) {
    console.error("Error updating command:", error);
    res.status(500).json({ error: "Failed to update command" });
  }
});

// TRIGGERS

// GET /api/admin/telegram-bot/triggers - List triggers
router.get("/triggers", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, event, enabled, template, target, segment, created_at FROM telegram_triggers ORDER BY created_at DESC"
    );

    res.json({ triggers: result.rows });
  } catch (error) {
    console.error("Error fetching triggers:", error);
    res.status(500).json({ error: "Failed to fetch triggers" });
  }
});

// POST /api/admin/telegram-bot/triggers - Create trigger
router.post("/triggers", async (req, res) => {
  try {
    const { event, enabled, template, target, segment } = req.body;

    if (!event || !template || !target) {
      return res.status(400).json({ error: "event, template, and target are required" });
    }

    const result = await pool.query(
      `INSERT INTO telegram_triggers (event, enabled, template, target, segment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [event, enabled !== false, template, target, segment || null]
    );

    await logAdminAction(req, "CREATE", "telegram_triggers", result.rows[0].id, { event });

    res.json({ trigger: result.rows[0] });
  } catch (error) {
    console.error("Error creating trigger:", error);
    res.status(500).json({ error: "Failed to create trigger" });
  }
});

// GET /api/admin/telegram-bot/triggers/:id - Get trigger
router.get("/triggers/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM telegram_triggers WHERE id = $1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Trigger not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching trigger:", error);
    res.status(500).json({ error: "Failed to fetch trigger" });
  }
});

// PUT /api/admin/telegram-bot/triggers/:id - Update trigger
router.put("/triggers/:id", async (req, res) => {
  try {
    const { event, enabled, template, target, segment } = req.body;

    const result = await pool.query(
      `UPDATE telegram_triggers
       SET event = $1, enabled = $2, template = $3, target = $4, segment = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [event, enabled !== false, template, target, segment || null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Trigger not found" });
    }

    await logAdminAction(req, "UPDATE", "telegram_triggers", req.params.id);

    res.json({ trigger: result.rows[0] });
  } catch (error) {
    console.error("Error updating trigger:", error);
    res.status(500).json({ error: "Failed to update trigger" });
  }
});

// DELETE /api/admin/telegram-bot/triggers/:id - Delete trigger
router.delete("/triggers/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM telegram_triggers WHERE id = $1 RETURNING id",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Trigger not found" });
    }

    await logAdminAction(req, "DELETE", "telegram_triggers", req.params.id);

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting trigger:", error);
    res.status(500).json({ error: "Failed to delete trigger" });
  }
});

// LOGS

// GET /api/admin/telegram-bot/logs - List logs
router.get("/logs", async (req, res) => {
  try {
    const { search = "", type = "", start = "", end = "", page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = "SELECT * FROM telegram_logs WHERE 1=1";
    const params = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (message ILIKE $${paramCount} OR command ILIKE $${paramCount} OR user ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (type) {
      query += ` AND type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }

    if (start) {
      query += ` AND created_at >= $${paramCount}`;
      params.push(start);
      paramCount++;
    }

    if (end) {
      query += ` AND created_at <= $${paramCount}`;
      params.push(end);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({ logs: result.rows });
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

export default router;
