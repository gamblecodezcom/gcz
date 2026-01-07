import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { log } from "./utils/logger.js";
import { registerAutoPatch } from "./routes/autoPatch.js";
import { registerCodeReview } from "./routes/codeReview.js";
import { registerCodeReviewOps } from "./routes/codeReviewOps.js";
import { registerDbRoutes } from "./routes/db.js";
import { registerGodMode } from "./routes/godmode.js";
import { registerGczTools } from "./routes/gcz.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerReviewerPersonality } from "./routes/reviewerPersonality.js";

export async function createServer() {
  const server = new Server({
    name: "gcz-mcp",
    version: "2.0.0",
    description: "GambleCodez Unified MCP Server"
  });

  const serverAny = server as unknown as {
    setRequestHandler: (schemaOrMethod: unknown, handler: unknown) => void;
    _requestHandlers: Map<string, (request: any, extra: any) => unknown>;
    connectStdio: () => Promise<void>;
  };

  const baseSetRequestHandler = serverAny.setRequestHandler.bind(server);
  serverAny.setRequestHandler = (schemaOrMethod: unknown, handler: any) => {
    if (typeof schemaOrMethod === "string") {
      serverAny._requestHandlers.set(schemaOrMethod, (request: any, extra: any) =>
        Promise.resolve(handler(request, extra))
      );
      return;
    }
    baseSetRequestHandler(schemaOrMethod, handler);
  };

  serverAny.connectStdio = async () => {
    const transport = new StdioServerTransport();
    await server.connect(transport);
  };

  registerHealthRoutes(server);
  registerDbRoutes(server);
  registerGczTools(server);
  registerGodMode(server);
  registerCodeReview(server);
  registerCodeReviewOps(server);
  registerReviewerPersonality(server);
  registerAutoPatch(server);

  log("GCZ MCP server initialized");

  return server;
}
