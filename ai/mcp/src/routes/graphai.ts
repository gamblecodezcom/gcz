import type { GczMcp } from "../utils/mcp";
import { pool } from "../services/db.js";

const safe = async (fn: () => Promise<{ content: { type: "json"; json: unknown }[] }>) => {
  try {
    return await fn();
  } catch (e: any) {
    return { content:[{type:"json",json:{error:true,message:String(e?.message||e)}}] };
  }
};

export function registerGraphAI(server: GczMcp){

  server.setRequestHandler<any,any>("gcz.user.graph", async (extra: any)=>safe(async()=>{
    const { user } = (extra.params||{}) as any;
    const q = await pool.query("select related_user,score from user_graph where user_id=$1",[user]);
    return {content:[{type:"json",json:{rows:q.rows}}]};
  }));

  server.setRequestHandler<any,any>("gcz.telemetry.ingest", async (extra: any)=>safe(async()=>{
    const { event } = (extra.params||{}) as any;
    await pool.query("insert into telemetry(data) values($1)",[event]);
    return {content:[{type:"json",json:{stored:true}}]};
  }));

  server.setRequestHandler<any,any>("gcz.visibility.map", async ()=>safe(async()=>{
    const q = await pool.query("select country,count(*) users from user_geo group by country");
    return {content:[{type:"json",json:{rows:q.rows}}]};
  }));
}
