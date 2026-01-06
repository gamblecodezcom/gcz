import { isAdmin } from "../lib/auth.js";
import { deny } from "../lib/approvals.js";

export default async function denyCmd(ctx){
  if(!isAdmin(ctx.from.id)) return;
  const id=(ctx.message?.text||"").split(" ")[1];
  if(!id) return ctx.reply("Usage:\n/deny <id>");
  const t=deny(id);
  if(!t) return ctx.reply("Not Found");
  return ctx.reply(`⛔ DENIED\nID: ${id}\n${t.task}`);
}
