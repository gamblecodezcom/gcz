import { isAdmin } from "../lib/auth.js";
import { queue } from "../lib/approvals.js";

export default async function build(ctx){
  const uid = ctx.from.id.toString();
  if(!isAdmin(uid)) return ctx.reply("⛔ Admin Only");

  const text=(ctx.message?.text||"").replace(/^\/build(@\S+)?/,"").trim();
  if(!text) return ctx.reply("Usage:\n/build <feature>");

  const id=Date.now().toString();
  queue({id,from:uid,task:text,status:"pending",ts:new Date().toISOString()});

  return ctx.reply(`🛠 BUILD REQUEST QUEUED\nID: ${id}\n${text}\n\nAwaiting Approval…`);
}
