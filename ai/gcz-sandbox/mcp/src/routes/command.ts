import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { pool } from "../services/db.js";

const safe = async (fn: () => Promise<{ content: { type: "json"; json: unknown }[] }>) => {
  try {
    return await fn();
  } catch (e: any) {
    return { content:[{type:"json",json:{error:true,message:String(e?.message||e)}}] };
  }
};

export function registerCommand(server: Server) {
  server.setRequestHandler<any,any>("gcz.dashboard.feed", async () => safe(async () => {
    const q = await pool.query("select ts,message,level from ops_log order by ts desc limit 50");
    return { content:[{type:"json",json:{rows:q.rows}}] };
  }));
}
