import { createServer } from "./server";
import { connectStdio } from "./utils/mcp";
import { log } from "./utils/logger";

async function main() {
  log("🚀 Starting GCZ MCP server…");
  const server = await createServer();
  await connectStdio(server);
  log("✨ GCZ MCP server is live");
}

main();
