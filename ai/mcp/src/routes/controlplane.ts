import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { pool } from "../services/db.js";

const safe = async (fn: () => Promise<{ content: { type: "json"; json: unknown }[] }>) => {
  try {
    return await fn();
  } catch (e: any) {
    return { content:[{type:"json",json:{error:true,message:String(e?.message||e)}}] };
  }
};

export function registerControlPlane(server:Server){

  server.setRequestHandler<any,any>("gcz.telegram.broadcast", async (extra: any) => safe(async () => {
    const { token, chat_id, message } = (extra.params||{}) as any;
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id, text: message })
    });
    const data = await res.json();
    return {content:[{type:"json",json:{ok:res.ok,response:data}}]};
  }));

  server.setRequestHandler<any,any>("gcz.discord.announce", async (extra: any) => safe(async () => {
    const { token, channel_id, message } = (extra.params||{}) as any;
    const res = await fetch(`https://discord.com/api/v10/channels/${channel_id}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bot ${token}`
      },
      body: JSON.stringify({ content: message })
    });
    const data = await res.json().catch(() => ({}));
    return {content:[{type:"json",json:{ok:res.ok,response:data}}]};
  }));

  server.setRequestHandler<any,any>("gcz.crm.copilot", async (extra: any)=>safe(async()=>{
    const { user } = (extra.params||{}) as any;
    const q = await pool.query("select * from user_kpis where user_id=$1",[user]);
    return {content:[{type:"json",json:{
      strategy:`Recommend free spins + retention drip to ${user}`,
      data:q.rows[0] || {}
    }}]};
  }));
}
