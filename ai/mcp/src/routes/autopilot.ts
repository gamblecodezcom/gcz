import type { GczMcp } from "../utils/mcp";
import { pool } from "../services/db.js";

const safe = async (fn: () => Promise<{ content: { type: "json"; json: unknown }[] }>) => {
  try {
    return await fn();
  } catch (e: any) {
    return { content:[{type:"json",json:{error:true,message:String(e?.message||e)}}] };
  }
};

export function registerAutopilot(server: GczMcp){

  server.setRequestHandler<any,any>("gcz.offer.autotune", async (extra: any)=>safe(async()=>{
    const { brand } = (extra.params||{}) as any;
    const q = await pool.query("select offer,conversion_rate from offer_health where brand=$1",[brand]);
    return {content:[{type:"json",json:{action:"increase bonus exposure",offers:q.rows}}]};
  }));

  server.setRequestHandler<any,any>("gcz.ops.alerts", async ()=>safe(async()=>{
    const q = await pool.query("select * from ops_alerts order by ts desc limit 10");
    return {content:[{type:"json",json:{rows:q.rows}}]};
  }));

  server.setRequestHandler<any,any>("gcz.brand.guardrails", async (extra: any)=>safe(async()=>{
    const { domain } = (extra.params||{}) as any;
    const q = await pool.query("select risk_score from brand_risk where domain=$1",[domain]);
    return {content:[{type:"json",json:{blocked:(q.rows[0]?.risk_score ?? 0) > 80}}]};
  }));
}
