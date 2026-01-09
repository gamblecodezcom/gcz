import type { GczMcp } from "../utils/mcp";
import { log } from "../utils/logger";
import { toolResult } from "../utils/mcp";

export function registerHealthRoutes(server: GczMcp) {
  const tool = (server.tool as any).bind(server);

  tool("health.check", async () => {
    log("Health check requested");
    return toolResult({ ok: true, service: "gcz-mcp" });
  });
}
