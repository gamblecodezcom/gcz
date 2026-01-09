import type { GczMcp } from "../utils/mcp";
import { z } from "zod";
import { query } from "../services/db";
import { log } from "../utils/logger";
import { toolResult } from "../utils/mcp";

type DbQueryInput = {
  sql: string;
  params?: unknown[];
};

export function registerDbRoutes(server: GczMcp) {
  const tool = (server.tool as any).bind(server);

  tool(
    "db.query",
    {
      sql: z.string(),
      params: z.array(z.any()).optional()
    },
    async ({ sql, params }: DbQueryInput) => {
      log(`DB query requested`);
      const rows = await query(sql, (params || []) as any[]);
      return toolResult({ rows });
    }
  );
}
