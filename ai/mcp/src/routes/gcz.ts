import type { GczMcp } from "../utils/mcp";
import { z } from "zod";
import { query } from "../services/db";
import { aiHealth, aiScan, aiMemory, aiAnomaly } from "../services/ai_client";
import { log } from "../utils/logger";
import { toolResult } from "../utils/mcp";

type MemoryReadInput = {
  category: string;
};

type MemoryWriteInput = {
  category: string;
  message?: string;
  meta?: unknown;
};

type AnomalyInput = {
  message: string;
  meta?: unknown;
};

type DbQueryInput = {
  sql: string;
  params?: unknown[];
};

type NameInput = {
  name: string;
};

type NameUrlInput = {
  name: string;
  url: string;
};

type UrlInput = {
  url: string;
};

type CodeInput = {
  code: string;
};

export function registerGczTools(server: GczMcp) {
  const tool = (server.tool as any).bind(server);


  // ============================================================
  // 1. AI ENGINE HEALTH
  // ============================================================
  tool("gcz.ai.health", async () => {
    log("AI health requested");
    const result = await aiHealth();
    return toolResult(result);
  });

  // ============================================================
  // 2. AI ENGINE FULL SCAN
  // ============================================================
  tool("gcz.ai.scan", async () => {
    log("AI scan requested");
    const result = await aiScan();
    return toolResult(result);
  });

  // ============================================================
  // 3. AI MEMORY (READ)
  // ============================================================
  tool(
    "gcz.ai.memory.read",
    { category: z.string() },
    async ({ category }: MemoryReadInput) => {
      log(`AI memory read: ${category}`);
      const result = await aiMemory(category);
      return toolResult(result);
    }
  );

  // ============================================================
  // 4. AI MEMORY (WRITE)
  // ============================================================
  tool(
    "gcz.ai.memory.write",
    {
      category: z.string(),
      message: z.string().optional(),
      meta: z.any().optional()
    },
    async ({ category, message, meta }: MemoryWriteInput) => {
      log(`AI memory write: ${category}`);
      const result = await aiMemory(category, message, meta);
      return toolResult(result);
    }
  );

  // ============================================================
  // 5. AI ANOMALY LOG
  // ============================================================
  tool(
    "gcz.ai.anomaly",
    {
      message: z.string(),
      meta: z.any().optional()
    },
    async ({ message, meta }: AnomalyInput) => {
      log("AI anomaly logged");
      const result = await aiAnomaly(message, meta);
      return toolResult(result);
    }
  );

  // ============================================================
  // 6. RAW SQL QUERY
  // ============================================================
  tool(
    "gcz.db.query",
    {
      sql: z.string(),
      params: z.array(z.any()).optional()
    },
    async ({ sql, params }: DbQueryInput) => {
      log(`SQL query: ${sql}`);
      const rows = await query(sql, (params || []) as any[]);
      return toolResult({ rows });
    }
  );

  // ============================================================
  // 7. AFFILIATE LOOKUP
  // ============================================================
  tool(
    "gcz.affiliate.lookup",
    { name: z.string() },
    async ({ name }: NameInput) => {
      log(`Affiliate lookup: ${name}`);
      const rows = await query(
        "SELECT * FROM affiliates WHERE LOWER(name)=LOWER($1) LIMIT 1",
        [name]
      );
      return toolResult(rows[0] || null);
    }
  );

  // ============================================================
  // 8. AFFILIATE ENRICHMENT
  // ============================================================
  tool(
    "gcz.affiliate.enrich",
    {
      name: z.string(),
      url: z.string()
    },
    async ({ name, url }: NameUrlInput) => {
      log(`Affiliate enrich: ${name}`);
      const rows = await query(
        `UPDATE affiliates
       SET resolved_domain = $2
       WHERE LOWER(name)=LOWER($1)
       RETURNING *`,
        [name, url]
      );
      return toolResult(rows[0] || null);
    }
  );

  // ============================================================
  // 9. REDIRECT RESOLVER
  // ============================================================
  tool(
    "gcz.redirect.resolve",
    { url: z.string() },
    async ({ url }: UrlInput) => {
      log(`Redirect resolve: ${url}`);
      const rows = await query(
        "SELECT resolved_domain FROM affiliates WHERE affiliate_url=$1 LIMIT 1",
        [url]
      );
      return toolResult(rows[0] || null);
    }
  );

  // ============================================================
  // 10. GCZ SITE CARD GENERATOR
  // ============================================================
  tool(
    "gcz.site.card",
    { name: z.string() },
    async ({ name }: NameInput) => {
      log(`Site card: ${name}`);
      const rows = await query(
        "SELECT * FROM affiliates WHERE LOWER(name)=LOWER($1) LIMIT 1",
        [name]
      );
      const a = rows[0];
      if (!a) return toolResult(null);

      const card = {
        title: a.name,
        url: a.affiliate_url,
        bonus: a.bonus_description,
        code: a.bonus_code,
        speed: a.redemption_speed,
        category: a.category,
        icon: a.icon_url
      };
      return toolResult(card);
    }
  );

  // ============================================================
  // 11. BONUS CODE VALIDATOR
  // ============================================================
  tool(
    "gcz.bonus.validate",
    { code: z.string() },
    async ({ code }: CodeInput) => {
      log(`Bonus code validate: ${code}`);
      const rows = await query(
        "SELECT * FROM affiliates WHERE bonus_code=$1 LIMIT 1",
        [code]
      );
      return toolResult(rows[0] || null);
    }
  );

  // ============================================================
  // 12. GCZ SYSTEM HEALTH
  // ============================================================
  tool("gcz.system.health", async () => {
    log("System health requested");
    const db = await query("SELECT NOW() as db_time");
    const ai = await aiHealth();
    return toolResult({
      db_ok: true,
      db_time: db[0].db_time,
      ai
    });
  });

  // ============================================================
  // 13. PM2 STATUS (via DB)
  // ============================================================
  tool("gcz.pm2.status", async () => {
    log("PM2 status requested");
    const rows = await query("SELECT * FROM service_health ORDER BY created_at DESC LIMIT 20");
    return toolResult(rows);
  });

}
