import express from "express";
import pool from "../../utils/db.js";
import superAdminOnly from "../../middleware/superAdminOnly.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/**
 * GET /api/admin/health
 * Get comprehensive system health status
 * Restricted to Super Admin only
 */
router.get("/", superAdminOnly, async (req, res) => {
  try {
    const health = {
      timestamp: new Date().toISOString(),
      api: {
        status: "healthy",
        uptime: process.uptime(),
        uptimeFormatted: formatUptime(process.uptime()),
      },
      database: {
        status: "unknown",
        connected: false,
        lastCheck: null,
      },
      raffles: {
        status: "unknown",
        activeCount: 0,
        totalCount: 0,
        endlessRaffleLinked: false,
      },
      wheel: {
        status: "unknown",
        configured: false,
        spinsPerDay: 0,
        targetRaffleId: null,
        prizeSlotsCount: 0,
      },
      drops: {
        status: "unknown",
        recentCount: 0,
        lastIngestion: null,
      },
      telegram: {
        status: "unknown",
        botTokenConfigured: !!process.env.TELEGRAM_BOT_TOKEN,
        adminIdConfigured: !!process.env.TELEGRAM_ADMIN_ID,
      },
      affiliates: {
        status: "unknown",
        totalCount: 0,
        lastSync: null,
      },
      errors: {
        recentErrors: [],
      },
    };

    // Check database connection
    try {
      const dbCheck = await pool.query("SELECT NOW() as current_time, COUNT(*) as user_count FROM users");
      health.database.status = "connected";
      health.database.connected = true;
      health.database.lastCheck = dbCheck.rows[0].current_time;
    } catch (dbError) {
      health.database.status = "disconnected";
      health.database.connected = false;
      health.database.error = dbError.message;
    }

    // Check raffles status
    try {
      const rafflesResult = await pool.query(
        `SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE active = true AND (end_date IS NULL OR end_date > NOW())) as active
         FROM raffles`
      );
      health.raffles.totalCount = parseInt(rafflesResult.rows[0].total) || 0;
      health.raffles.activeCount = parseInt(rafflesResult.rows[0].active) || 0;
      health.raffles.status = health.raffles.activeCount > 0 ? "active" : "no_active_raffles";

      // Check if endless raffle is linked to wheel
      const wheelConfig = await pool.query(
        "SELECT target_raffle_id FROM wheel_config WHERE id = 1 LIMIT 1"
      );
      if (wheelConfig.rows.length > 0 && wheelConfig.rows[0].target_raffle_id) {
        health.raffles.endlessRaffleLinked = true;
      }
    } catch (raffleError) {
      health.raffles.status = "error";
      health.raffles.error = raffleError.message;
    }

    // Check wheel configuration
    try {
      const wheelResult = await pool.query(
        `SELECT 
          wc.spins_per_day,
          wc.target_raffle_id,
          COUNT(wps.id) as slots_count
         FROM wheel_config wc
         LEFT JOIN wheel_prize_slots wps ON wps.wheel_config_id = wc.id
         WHERE wc.id = 1
         GROUP BY wc.id, wc.spins_per_day, wc.target_raffle_id`
      );

      if (wheelResult.rows.length > 0) {
        const wheel = wheelResult.rows[0];
        health.wheel.configured = true;
        health.wheel.status = "configured";
        health.wheel.spinsPerDay = wheel.spins_per_day || 0;
        health.wheel.targetRaffleId = wheel.target_raffle_id;
        health.wheel.prizeSlotsCount = parseInt(wheel.slots_count) || 0;
      } else {
        health.wheel.status = "not_configured";
      }
    } catch (wheelError) {
      health.wheel.status = "error";
      health.wheel.error = wheelError.message;
    }

    // Check drops ingestion (recent promos)
    try {
      const dropsResult = await pool.query(
        `SELECT 
          COUNT(*) as recent_count,
          MAX(created_at) as last_ingestion
         FROM promos
         WHERE created_at > NOW() - INTERVAL '24 hours'`
      );
      health.drops.recentCount = parseInt(dropsResult.rows[0].recent_count) || 0;
      health.drops.lastIngestion = dropsResult.rows[0].last_ingestion;
      health.drops.status = health.drops.recentCount > 0 ? "active" : "no_recent_drops";
    } catch (dropsError) {
      health.drops.status = "error";
      health.drops.error = dropsError.message;
    }

    // Check Telegram bot configuration
    health.telegram.status = health.telegram.botTokenConfigured && health.telegram.adminIdConfigured 
      ? "configured" 
      : "not_configured";

    // Check affiliates sync
    try {
      const affiliatesResult = await pool.query(
        `SELECT 
          COUNT(*) as total,
          MAX(updated_at) as last_sync
         FROM affiliates_master`
      );
      health.affiliates.totalCount = parseInt(affiliatesResult.rows[0].total) || 0;
      health.affiliates.lastSync = affiliatesResult.rows[0].last_sync;
      health.affiliates.status = health.affiliates.totalCount > 0 ? "synced" : "empty";
    } catch (affiliatesError) {
      health.affiliates.status = "error";
      health.affiliates.error = affiliatesError.message;
    }

    // Overall system status
    const overallStatus = 
      health.database.connected &&
      health.raffles.status !== "error" &&
      health.wheel.status !== "error" &&
      health.drops.status !== "error" &&
      health.affiliates.status !== "error"
        ? "healthy"
        : "degraded";

    res.json({
      status: overallStatus,
      ...health,
    });
  } catch (error) {
    console.error("Health check error:", error);
    res.status(500).json({
      status: "error",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Helper function to format uptime in human-readable format
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(" ");
}

export default router;
