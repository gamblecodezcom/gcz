import type { GczMcp } from "../utils/mcp";
import { log } from "../utils/logger.js";

export function registerReviewerPersonality(server: GczMcp) {

  let persona = "Direct but helpful AI reviewer";

  server.setRequestHandler<any,any>("gcz.codereview.personality.set", async (extra: any) => {
    persona = extra.params?.style || persona;
    return { content:[{type:"json",json:{persona}}] };
  });

  server.setRequestHandler<any,any>("gcz.codereview.personality.review", async (extra: any) => {
    const { risk } = extra.params||{};
    log("persona review risk="+risk);
    return { content:[{type:"json",json:{
      persona,
      decision:risk==="critical"?"BLOCK":"ALLOW_WITH_WARNING"
    }}] };
  });

  log("Reviewer-Persona online");
}