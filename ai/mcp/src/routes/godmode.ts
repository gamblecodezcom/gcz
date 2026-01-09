import type { GczMcp } from "../utils/mcp";
import { pool } from "../services/db.js";

const safe = async (fn: () => Promise<{ content: { type: "json"; json: unknown }[] }>) => {
  try {
    return await fn();
  } catch (err: any) {
    return { content:[{type:"json",json:{error:true,message:String(err?.message||err)}}] };
  }
};

export function registerGodMode(server: GczMcp) {

  server.setRequestHandler<any,any>("gcz.user.timeline", async (extra: any) => safe(async ()=>{
    const { user } = (extra.params||{}) as any;
    const q = await pool.query("select * from user_events where user_id=$1 order by ts desc limit 100",[user]);
    return { content:[{type:"json",json:{rows:q.rows}}] };
  }));

  server.setRequestHandler<any,any>("gcz.user.saveflow", async (extra: any) => safe(async ()=>{
    const { user, flow } = (extra.params||{}) as any;
    await pool.query("insert into retention_flows(user_id,flow) values($1,$2)",[user,flow]);
    return { content:[{type:"json",json:{saved:true}}] };
  }));

  server.setRequestHandler<any,any>("gcz.brand.protect", async (extra: any) => safe(async ()=>{
    const { domain } = (extra.params||{}) as any;
    const q = await pool.query("select risk_score from brand_risk where domain=$1",[domain]);
    return { content:[{type:"json",json:{risk_score:q.rows[0]?.risk_score ?? 0}}] };
  }));

  server.setRequestHandler<any,any>("gcz.vip.predict", async (extra: any) => safe(async ()=>{
    const { user } = (extra.params||{}) as any;
    const q = await pool.query("select whale_probability from vip_predictions where user_id=$1",[user]);
    return { content:[{type:"json",json:{whale_probability:q.rows[0]?.whale_probability ?? 0.01}}] };
  }));

  server.setRequestHandler<any,any>("gcz.offer.health", async (extra: any) => safe(async ()=>{
    const { brand } = (extra.params||{}) as any;
    const q = await pool.query("select offer,status,conversion_rate from offer_health where brand=$1",[brand]);
    return { content:[{type:"json",json:{rows:q.rows}}] };
  }));

  server.setRequestHandler<any,any>("gcz.session.cluster", async (extra: any) => safe(async ()=>{
    const { user } = (extra.params||{}) as any;
    const q = await pool.query("select cluster from session_clusters where user_id=$1",[user]);
    return { content:[{type:"json",json:{cluster:q.rows[0]?.cluster ?? "cold"}}] };
  }));

  server.setRequestHandler<any,any>("gcz.dashboard.metrics", async () => safe(async ()=>{
    const q = await pool.query("select count(*) users, sum(revenue) revenue from kpi_summary");
    return { content:[{type:"json",json:{metrics:q.rows[0] || {}}}] };
  }));

}