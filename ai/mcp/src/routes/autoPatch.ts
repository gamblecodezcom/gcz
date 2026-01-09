import type { GczMcp } from "../utils/mcp";
import { log } from "../utils/logger.js";

export function registerAutoPatch(server: GczMcp) {

  const history: any[] = [];

  server.setRequestHandler<any,any>("gcz.autopatch.scan", async (extra: any) => {
    const { repo } = extra.params||{};
    log("scan risk:"+repo);
    return { content:[{type:"json",json:{risk:"medium"}}] };
  });

  server.setRequestHandler<any,any>("gcz.autopatch.simulate", async (extra: any) => {
    history.push({ts:Date.now(),...extra.params});
    return { content:[{type:"json",json:{applied:true,warnings:1}}] };
  });

  server.setRequestHandler<any,any>("gcz.autopatch.rollback", async (extra: any) => {
    return { content:[{type:"json",json:{rolled_back:true}}] };
  });

  server.setRequestHandler<any,any>("gcz.autopatch.audit", async (extra: any) => {
    return { content:[{type:"json",json:{events:history}}] };
  });

  log("Auto-Patch-Mode online");
}