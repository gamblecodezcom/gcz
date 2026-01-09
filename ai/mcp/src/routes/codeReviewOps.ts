import type { GczMcp } from "../utils/mcp";
import { log } from "../utils/logger.js";

export function registerCodeReviewOps(server: GczMcp) {

  const memory:any[] = [];

  server.setRequestHandler<any,any>("gcz.codereview.pr.comment", async (extra: any) => {
    return { content:[{type:"json",json:{ok:true}}] };
  });

  server.setRequestHandler<any,any>("gcz.codereview.block", async (extra: any) => {
    const { risk } = extra.params || {};
    return { content:[{type:"json",json:{blocked:risk==="critical"}}] };
  });

  server.setRequestHandler<any,any>("gcz.codereview.train", async (extra: any) => {
    memory.push(extra.params||{});
    return { content:[{type:"json",json:{stored:memory.length}}] };
  });

  server.setRequestHandler<any,any>("gcz.codereview.rewrite", async (extra: any) => {
    return { content:[{type:"json",json:{suggestion:"Refactor for safety + clarity"}}] };
  });

  server.setRequestHandler<any,any>("gcz.codereview.whale", async (extra: any) => {
    return { content:[{type:"json",json:{probability:0.82}}] };
  });

  server.setRequestHandler<any,any>("gcz.codereview.feed", async (extra: any) => {
    return { content:[{type:"json",json:{stream:true}}] };
  });

  log("GCZ CodeReview-Ops online");
}