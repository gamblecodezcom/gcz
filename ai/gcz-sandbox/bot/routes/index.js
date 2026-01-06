import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { log } from "../utils/logger.js";

/**
 * Auto-loads ALL bot command modules.
 * Supports:
 * - commands.autoresponse.js
 * - commands.wheel.js
 * - commands.stats.js
 * - commands.user.js
 * - commands.admin.js
 * - commands.missions.js
 * - commands.badges.js
 * - commands.leaderboard.js
 * - commands.raffles.js
 * - commands.giveaways.js
 * - commands.drops.js
 * - commands.promos.js
 * - ANY future *.js command file
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function loadRoutes(bot) {
  log("routes", "Loading all GambleCodez bot modules...");

  const files = fs
    .readdirSync(__dirname)
    .filter((file) => file.endsWith(".js") && file !== "index.js");

  if (files.length === 0) {
    log("routes", "⚠️ No command modules found.");
    return;
  }

  for (const file of files) {
    const modulePath = path.join(__dirname, file);

    try {
      const routeModule = await import(modulePath);

      if (typeof routeModule.default === "function") {
        routeModule.default(bot);
        log("routes", `✓ Loaded: ${file}`);
      } else {
        log("routes", `⚠️ Skipped (no default export): ${file}`);
      }
    } catch (err) {
      log("routes", `❌ Failed to load ${file}`, err);
    }
  }

  log("routes", "All bot modules loaded successfully.");
}
