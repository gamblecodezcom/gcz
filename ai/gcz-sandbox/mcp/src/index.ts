import { createServer } from "./server.js";
import { log } from "./utils/logger.js";

async function main() {
  const server = await createServer();
  await server.connectStdio();
  log("GCZ MCP server online via STDIO");
}

main();
