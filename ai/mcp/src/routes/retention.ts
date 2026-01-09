import type { GczMcp } from "../utils/mcp";
import { pool } from "../services/db.js";

const safe = async (fn: () => Promise<{ content: { type: "json"; json: unknown }[] }>) => {
  try {
    return await fn();
  } catch (e: any) {
    return { content:[{type:"json",json:{error:true,message:String(e?.message||e)}}] };
  }
};

export function registerRetention(server: GczMcp) {
  server.setRequestHandler<any,any>("gcz.retention.rescue", async (extra: any) => safe(async () => {
    const { user } = (extra.params||{}) as any;
    const q = await pool.query("select churn_risk from churn_scores where user_id=$1",[user]);
    return { content:[{type:"json",json:{row:q.rows[0] || {}}}] };
  }));
}