import { createGczMcpServer, type GczMcp } from "./utils/mcp";
import { log } from "./utils/logger";

// Core routes
import { registerHealthRoutes } from "./routes/health";
import { registerDbRoutes } from "./routes/db";

// Unified GCZ tool suite
import { registerGczTools } from "./routes/gcz";
import { registerGodMode } from "./routes/godmode";
import { registerGraphAI } from "./routes/graphai";
import { registerRetention } from "./routes/retention";
import { registerNeural } from "./routes/neural";
import { registerAutopilot } from "./routes/autopilot";
import { registerAutoPatch } from "./routes/autoPatch";
import { registerCommand } from "./routes/command";
import { registerControlPlane } from "./routes/controlplane";
import { registerCodeReview } from "./routes/codeReview";
import { registerCodeReviewOps } from "./routes/codeReviewOps";
import { registerReviewerPersonality } from "./routes/reviewerPersonality";
import { registerNarrative } from "./routes/narrative";

export async function createServer(): Promise<GczMcp> {
  const server = createGczMcpServer({
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
  registerGodMode(server);
  registerGraphAI(server);
  registerRetention(server);
  registerNeural(server);
  registerAutopilot(server);
  registerAutoPatch(server);
  registerCommand(server);
  registerControlPlane(server);
  registerCodeReview(server);
  registerCodeReviewOps(server);
  registerReviewerPersonality(server);
  registerNarrative(server);

  // ------------------------------------------------------------
  // Log + return
  // ------------------------------------------------------------
  log("GCZ MCP: all routes registered");
  return server;
}
