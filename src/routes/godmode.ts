import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { pool } from "../services/db.js";
import { log } from "../utils/logger.js";

export function registerGodMode(server: Server) {

  const safe = async (fn: Function) => {
    try { return await fn(); }
    catch (err: any) {
      log("GODMODE ERROR " + (err?.message || err));
      return { content:[{type:"text",text:JSON.stringify({error:true,message:String(err?.message||err)})}] };
    }
  };

  server.setRequestHandler("gcz.health", async () => ({
    content:[{type:"text",text:JSON.stringify({ok:true,service:"GCZ MCP GODMODE"})}]
  }));

  server.setRequestHandler("gcz.user.timeline", async extra => safe(async ()=>{
    const { user } = (extra.params||{}) as any;
    const q = await pool.query("select * from user_events where user_id=$1 order by ts desc limit 100",[user]);
    return { content:[{type:"text",text:JSON.stringify(q.rows)}] };
  }));

  server.setRequestHandler("gcz.user.saveflow", async extra => safe(async ()=>{
    const { user, flow } = (extra.params||{}) as any;
    await pool.query("insert into retention_flows(user_id,flow) values($1,$2)",[user,flow]);
    return { content:[{type:"text",text:JSON.stringify({saved:true})}] };
  }));

  server.setRequestHandler("gcz.brand.protect", async extra => safe(async ()=>{
    const { domain } = (extra.params||{}) as any;
    const q = await pool.query("select risk_score from brand_risk where domain=$1",[domain]);
    return { content:[{type:"text",text:JSON.stringify(q.rows[0]||{risk_score:0})}] };
  }));

  server.setRequestHandler("gcz.vip.predict", async extra => safe(async ()=>{
    const { user } = (extra.params||{}) as any;
    const q = await pool.query("select whale_probability from vip_predictions where user_id=$1",[user]);
    return { content:[{type:"text",text:JSON.stringify(q.rows[0]||{whale_probability:0.01})}] };
  }));

  log("GCZ GODMODE registered");
}
