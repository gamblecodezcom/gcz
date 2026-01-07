import { Server } from "@modelcontextprotocol/sdk";
import { query } from "../services/db";
import { log } from "../utils/logger";

export function registerDbRoutes(server: Server) {
  server.tool("db.query", async ({ sql, params }) => {
    log(`DB query requested`);
    const rows = await query(sql, params || []);
    return { rows };
  });
}