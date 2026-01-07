import { Server } from "@modelcontextprotocol/sdk";
import { log } from "../utils/logger";

export function registerHealthRoutes(server: Server) {
  server.tool("health.check", async () => {
    log("Health check requested");
    return { ok: true, service: "gcz-mcp" };
  });
}