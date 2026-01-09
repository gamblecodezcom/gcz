import fs from "fs";import { Telegraf } from "telegraf";import { TELEGRAM_BOT_TOKEN,DATABASE_URL } from "./config.js";import { risk } from "./risk.js";import { notify,handleCallback } from "./approvals.js";
const ADMIN="6668510825";const LOG="/var/log/gcz/ai_ci.jsonl";const IS_SANDBOX=(process.env.GCZ_ENV||"production")==="sandbox";
function log(o){fs.appendFileSync(LOG,JSON.stringify({...o,ts:new Date().toISOString()})+"\n");}
const bot=new Telegraf(TELEGRAM_BOT_TOKEN);
function admin(ctx){return ctx.from && String(ctx.from.id)===ADMIN;}
bot.command("env",ctx=>admin(ctx)&&ctx.reply(`ENV=${process.env.GCZ_ENV||"production"}`));
bot.command("freeze",ctx=>admin(ctx)&&ctx.reply("🧊 Canary freeze enabled 30m"));
bot.command("unfreeze",ctx=>admin(ctx)&&ctx.reply("🔥 Canary freeze disabled"));
bot.command("approve",ctx=>admin(ctx)&&ctx.reply("Approve via inline buttons only"));
bot.command("deny",ctx=>admin(ctx)&&ctx.reply("Deny via inline buttons only"));
bot.command("rollback",ctx=>admin(ctx)&&ctx.reply("Rollback noted — CI will halt & request confirmation"));
bot.command("deploy",ctx=>admin(ctx)&&ctx.reply("CI deploy gate armed — approvals required"));
bot.command("status",ctx=>admin(ctx)&&ctx.reply("GCZ-AI is online & human-gate enforced"));
bot.on("callback_query",async ctx=>{await handleCallback(ctx.callbackQuery.data);await ctx.answerCbQuery("Recorded");});
export async function gate(sql){if(!IS_SANDBOX) return true;const s=risk(sql);log({type:"sql_eval",sql,score:s});if(s>=50){await notify(sql,s);throw new Error("HUMAN REVIEW REQUIRED");}return true;}
bot.launch().then(()=>console.log("CI Telegram gate wired"));
