import { Server } from "@modelcontextprotocol/sdk";
import { log } from "./utils/logger";

// Core routes
import { registerHealthRoutes } from "./routes/health";
import { registerDbRoutes } from "./routes/db";

// Unified GCZ tool suite
import { registerGczTools } from "./routes/gcz";

export async function createServer() {
  const server = new Server({
    name: "gcz-mcp",
    version: "2.0.0",
    description: "GambleCodez Unified MCP Server"
  });

  // ------------------------------------------------------------
  // Register core tools
  // ------------------------------------------------------------
  registerHealthRoutes(server);
  registerDbRoutes(server);

  // ------------------------------------------------------------
  // Register full GCZ unified tool suite
  // ------------------------------------------------------------
  registerGczTools(server);

  // ------------------------------------------------------------
  // Log + return
  // ------------------------------------------------------------
  log("GCZ MCP: all routes registered");
  return server;
}