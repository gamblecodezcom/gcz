import { isAdmin } from "../lib/auth.js";
import { approve } from "../lib/approvals.js";

export default async function approveCmd(ctx){
  if(!isAdmin(ctx.from.id)) return;
  const id=(ctx.message?.text||"").split(" ")[1];
  if(!id) return ctx.reply("Usage:\n/approve <id>");
  const t=approve(id);
  if(!t) return ctx.reply("Not Found");
  return ctx.reply(`✅ APPROVED\nID: ${id}\n${t.task}`);
}
