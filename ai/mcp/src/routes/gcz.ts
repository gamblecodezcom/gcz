import { Server } from "@modelcontextprotocol/sdk";
import { query } from "../services/db";
import { aiHealth, aiScan, aiMemory, aiAnomaly } from "../services/ai_client";
import { log } from "../utils/logger";

export function registerGczTools(server: Server) {

  // ============================================================
  // 1. AI ENGINE HEALTH
  // ============================================================
  server.tool("gcz.ai.health", async () => {
    log("AI health requested");
    return await aiHealth();
  });

  // ============================================================
  // 2. AI ENGINE FULL SCAN
  // ============================================================
  server.tool("gcz.ai.scan", async () => {
    log("AI scan requested");
    return await aiScan();
  });

  // ============================================================
  // 3. AI MEMORY (READ)
  // ============================================================
  server.tool("gcz.ai.memory.read", async ({ category }) => {
    log(`AI memory read: ${category}`);
    return await aiMemory(category);
  });

  // ============================================================
  // 4. AI MEMORY (WRITE)
  // ============================================================
  server.tool("gcz.ai.memory.write", async ({ category, message, meta }) => {
    log(`AI memory write: ${category}`);
    return await aiMemory(category, message, meta);
  });

  // ============================================================
  // 5. AI ANOMALY LOG
  // ============================================================
  server.tool("gcz.ai.anomaly", async ({ message, meta }) => {
    log("AI anomaly logged");
    return await aiAnomaly(message, meta);
  });

  // ============================================================
  // 6. RAW SQL QUERY
  // ============================================================
  server.tool("gcz.db.query", async ({ sql, params }) => {
    log(`SQL query: ${sql}`);
    const rows = await query(sql, params || []);
    return { rows };
  });

  // ============================================================
  // 7. AFFILIATE LOOKUP
  // ============================================================
  server.tool("gcz.affiliate.lookup", async ({ name }) => {
    log(`Affiliate lookup: ${name}`);
    const rows = await query(
      "SELECT * FROM affiliates WHERE LOWER(name)=LOWER($1) LIMIT 1",
      [name]
    );
    return rows[0] || null;
  });

  // ============================================================
  // 8. AFFILIATE ENRICHMENT
  // ============================================================
  server.tool("gcz.affiliate.enrich", async ({ name, url }) => {
    log(`Affiliate enrich: ${name}`);
    const rows = await query(
      `UPDATE affiliates
       SET resolved_domain = $2
       WHERE LOWER(name)=LOWER($1)
       RETURNING *`,
      [name, url]
    );
    return rows[0] || null;
  });

  // ============================================================
  // 9. REDIRECT RESOLVER
  // ============================================================
  server.tool("gcz.redirect.resolve", async ({ url }) => {
    log(`Redirect resolve: ${url}`);
    const rows = await query(
      "SELECT resolved_domain FROM affiliates WHERE affiliate_url=$1 LIMIT 1",
      [url]
    );
    return rows[0] || null;
  });

  // ============================================================
  // 10. GCZ SITE CARD GENERATOR
  // ============================================================
  server.tool("gcz.site.card", async ({ name }) => {
    log(`Site card: ${name}`);
    const rows = await query(
      "SELECT * FROM affiliates WHERE LOWER(name)=LOWER($1) LIMIT 1",
      [name]
    );
    const a = rows[0];
    if (!a) return null;

    return {
      title: a.name,
      url: a.affiliate_url,
      bonus: a.bonus_description,
      code: a.bonus_code,
      speed: a.redemption_speed,
      category: a.category,
      icon: a.icon_url
    };
  });

  // ============================================================
  // 11. BONUS CODE VALIDATOR
  // ============================================================
  server.tool("gcz.bonus.validate", async ({ code }) => {
    log(`Bonus code validate: ${code}`);
    const rows = await query(
      "SELECT * FROM affiliates WHERE bonus_code=$1 LIMIT 1",
      [code]
    );
    return rows[0] || null;
  });

  // ============================================================
  // 12. GCZ SYSTEM HEALTH
  // ============================================================
  server.tool("gcz.system.health", async () => {
    log("System health requested");
    const db = await query("SELECT NOW() as db_time");
    const ai = await aiHealth();
    return {
      db_ok: true,
      db_time: db[0].db_time,
      ai
    };
  });

  // ============================================================
  // 13. PM2 STATUS (via DB)
  // ============================================================
  server.tool("gcz.pm2.status", async () => {
    log("PM2 status requested");
    const rows = await query("SELECT * FROM service_health ORDER BY created_at DESC LIMIT 20");
    return rows;
  });

}