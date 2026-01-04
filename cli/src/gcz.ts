#!/usr/bin/env node

import fetch from "node-fetch";
import { log } from "./utils/logger";

const MCP_URL = process.env.GCZ_MCP_URL || "http://127.0.0.1:3001";

async function callTool(tool: string, body: any = {}) {
  const res = await fetch(`${MCP_URL}/tool/${tool}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  switch (cmd) {
    // ------------------------------------------------------------
    // AI ENGINE
    // ------------------------------------------------------------
    case "ai:health":
      log("Checking AI engine health…");
      console.log(await callTool("gcz.ai.health"));
      break;

    case "ai:scan":
      log("Running full AI scan…");
      console.log(await callTool("gcz.ai.scan"));
      break;

    case "ai:memory:get":
      console.log(await callTool("gcz.ai.memory.read", { category: args[1] }));
      break;

    case "ai:memory:set":
      console.log(
        await callTool("gcz.ai.memory.write", {
          category: args[1],
          message: args[2] || "",
          meta: {}
        })
      );
      break;

    case "ai:anomaly":
      console.log(
        await callTool("gcz.ai.anomaly", {
          message: args[1] || "Unknown anomaly",
          meta: {}
        })
      );
      break;

    // ------------------------------------------------------------
    // DATABASE
    // ------------------------------------------------------------
    case "db:query":
      console.log(
        await callTool("gcz.db.query", {
          sql: args.slice(1).join(" ")
        })
      );
      break;

    // ------------------------------------------------------------
    // AFFILIATES
    // ------------------------------------------------------------
    case "aff:lookup":
      console.log(await callTool("gcz.affiliate.lookup", { name: args[1] }));
      break;

    case "aff:enrich":
      console.log(
        await callTool("gcz.affiliate.enrich", {
          name: args[1],
          url: args[2]
        })
      );
      break;

    case "aff:card":
      console.log(await callTool("gcz.site.card", { name: args[1] }));
      break;

    case "aff:bonus":
      console.log(await callTool("gcz.bonus.validate", { code: args[1] }));
      break;

    // ------------------------------------------------------------
    // SYSTEM HEALTH
    // ------------------------------------------------------------
    case "sys:health":
      console.log(await callTool("gcz.system.health"));
      break;

    case "sys:pm2":
      console.log(await callTool("gcz.pm2.status"));
      break;

    // ------------------------------------------------------------
    // HELP
    // ------------------------------------------------------------
    default:
      console.log(`
GCZ CLI — God Mode

AI ENGINE
  gcz ai:health              Check AI engine health
  gcz ai:scan                Run full AI scan
  gcz ai:memory:get <cat>    Read AI memory
  gcz ai:memory:set <cat> <msg>  Write AI memory
  gcz ai:anomaly <msg>       Log anomaly

DATABASE
  gcz db:query "<SQL>"       Run SQL query

AFFILIATES
  gcz aff:lookup <name>      Lookup affiliate
  gcz aff:enrich <name> <url>  Enrich affiliate
  gcz aff:card <name>        Generate site card
  gcz aff:bonus <code>       Validate bonus code

SYSTEM
  gcz sys:health             Full system health
  gcz sys:pm2                PM2 status

`);
  }
}

main();