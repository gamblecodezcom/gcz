// /var/www/html/gcz/bot/services/telegramRoles.js

import pg from "pg";
import { logger } from "../utils/logger.js";
import { config } from "../config.js";

const pool = new pg.Pool({
  connectionString: process.env.GCZ_DB || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const ROLE_MEMBER = 1;
const ROLE_MOD = 3;
const ROLE_ADMIN = 4;
const ROLE_SUPER_ADMIN = 5;

export async function getTelegramUserById(telegramId) {
  const res = await pool.query(
    `SELECT tur.telegram_id,
            tur.roleid,
            tr.name AS role_name,
            tr.level
     FROM telegramuserroles tur
     JOIN telegram_roles tr ON tr.id = tur.roleid
     WHERE tur.telegram_id = $1`,
    [telegramId]
  );

  return res.rows[0] || null;
}

export async function setTelegramRole(telegramId, roleId) {
  try {
    await pool.query(
      `INSERT INTO telegramuserroles (telegram_id, roleid)
       VALUES ($1, $2)
       ON CONFLICT (telegram_id) DO UPDATE SET roleid = EXCLUDED.roleid`,
      [telegramId, roleId]
    );
    return true;
  } catch (err) {
    logger.error("Failed to set Telegram role:", err);
    return false;
  }
}

// Resolve by @username using your JSON storage layer
import { getAllUsers } from "../utils/storage.js";

export function resolveTelegramIdByUsername(usernameRaw) {
  const username = usernameRaw.replace(/^@/, "").toLowerCase();
  const users = getAllUsers();

  for (const user of users) {
    if ((user.username || "").toLowerCase() === username) {
      return user.id;
    }
  }

  return null;
}

export const TELEGRAM_ROLE_CONSTANTS = {
  MEMBER: ROLE_MEMBER,
  MOD: ROLE_MOD,
  ADMIN: ROLE_ADMIN,
  SUPER_ADMIN: ROLE_SUPER_ADMIN
};