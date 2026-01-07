import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { pool } from "../services/db.js";

const safe = async (fn: () => Promise<{ content: { type: "json"; json: unknown }[] }>) => {
  try {
    return await fn();
  } catch (e: any) {
    return { content:[{type:"json",json:{error:true,message:String(e?.message||e)}}] };
  }
};

export function registerNeural(server: Server) {
  server.setRequestHandler<any,any>("gcz.vip.brain", async () => safe(async () => {
    const q = await pool.query("select user_id,whale_score from vip_scores order by whale_score desc limit 10");
    return { content:[{type:"json",json:{rows:q.rows}}] };
  }));

  server.setRequestHandler<any,any>("gcz.fraud.radar", async () => safe(async () => {
    const q = await pool.query("select user_id,risk_score from fraud_risk where risk_score>80");
    return { content:[{type:"json",json:{rows:q.rows}}] };
  }));
}
