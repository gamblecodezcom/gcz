import { createServer } from "./server";
import { log } from "./utils/logger";

async function main() {
  log("🚀 Starting GCZ MCP server…");
  const server = await createServer();
  await server.start();
  log("✨ GCZ MCP server is live");
}

main();