import { isAdmin } from "../lib/auth.js";
import { rollbackMark } from "../lib/approvals.js";

export default async function rollbackCmd(ctx){
  if(!isAdmin(ctx.from.id)) return;
  const id=(ctx.message?.text||"").split(" ")[1];
  if(!id) return ctx.reply("Usage:\n/rollback <id>");
  const t=rollbackMark(id);
  if(!t) return ctx.reply("Not Found");
  return ctx.reply(`♻️ ROLLBACK MARKED\nID: ${id}\n${t.task}`);
}
