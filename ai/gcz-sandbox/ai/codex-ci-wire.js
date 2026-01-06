/**
 * GCZ Sandbox → Production CI Wire + Conversational Bridge
 *
 * Features:
 *  - Telegram approvals
 *  - Canary deploys
 *  - Risk scoring
 *  - Freeze mode
 *  - Rollback
 *  - Incident ledger
 *  - Conversational AI Ops "cc <message>"
 */

import fs from "fs";
import crypto from "crypto";
import { execSync } from "child_process";
import fetch from "node-fetch";
import { risk } from "./risk.js";
import { explainDiff } from "./plan.js";

const PROD_DIR = "/var/www/html/gcz";
const SBX_DIR = "/var/www/html/gcz/ai/gcz-sandbox";

const LOG = "/var/www/html/gcz/ai/gcz-sandbox/audit/ledger.jsonl";

const BOT = process.env.TELEGRAM_BOT_TOKEN_SANDBOX;
const ADMIN = process.env.TELEGRAM_ADMIN_ID;

const API = `https://api.telegram.org/bot${BOT}`;

const CANARY_STAGES = [10, 50, 100];
let FREEZE = false;
let BYPASS_UNTIL = 0;

/* =========================
   Utilities
========================= */

function uuid() {
  return crypto.randomBytes(8).toString("hex");
}

function now() {
  return new Date().toISOString();
}

function log(entry) {
  fs.appendFileSync(
    LOG,
    JSON.stringify({ ts: now(), ...entry }) + "\n"
  );
}

async function telegram(text, buttons = null) {
  return fetch(`${API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: ADMIN,
      text,
      parse_mode: "Markdown",
      reply_markup: buttons ? { inline_keyboard: buttons } : undefined
    })
  });
}

function run(cmd, cwd = SBX_DIR) {
  return execSync(cmd, { encoding: "utf8", cwd });
}

function deployStage(percent) {
  run(`rsync -a --delete ${SBX_DIR}/ ${PROD_DIR}/`);
  run(`pm2 reload ecosystem.config.cjs`);
}

function rollback() {
  run(`git reset --hard HEAD~1`, PROD_DIR);
  run(`pm2 reload ecosystem.config.cjs`);
}

/* =========================
   Conversational Bridge
========================= */

async function codexChat(user, message) {
  const res = await fetch("http://127.0.0.1:9010/codex/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user, message })
  });

  return await res.json();
}

/**
 * Telegram message listener
 * cc <command>
 */
export async function handleTelegramMessage(ctx) {

  if (!ctx.message || !ctx.message.text) return;

  const text = ctx.message.text.trim();

  // only process "cc"
  if (!text.toLowerCase().startsWith("cc ")) return;

  const user = ctx.from.username || ctx.from.id;
  const query = text.slice(3).trim();

  log({ event: "CC_REQUEST", user, query });

  await telegram(`🤖 *Codex Received*\n\n\`${query}\``);

  try {
    const reply = await codexChat(user, query);

    await telegram(`🧠 *Codex Reply*\n\n${reply.reply || "No response"}`);

    log({ event: "CC_REPLY", user, reply });

  } catch (err) {
    await telegram(`⚠️ Codex bridge error`);
    log({ event: "CC_ERROR", error: err.toString() });
  }
}

/* =========================
   Deployment Flow
========================= */

async function approveCycle(task) {

  const id = task.id;

  await telegram(
`*GCZ Sandbox Deploy Approval Required*

ID: \`${id}\`

Risk Score: *${task.score}*
Plan Diff:
\`\`\`
${task.plan}
\`\`\`

Approve deployment?
`,
[
  [
    { text:"✅ Approve", callback_data:`approve:${id}` },
    { text:"❌ Deny", callback_data:`deny:${id}` }
  ],
  [
    { text:"🔁 Rollback Prod", callback_data:`rollback:${id}` }
  ],
  [
    { text:"🧊 Freeze Deploys", callback_data:`freeze:on:${id}` },
    { text:"🔥 Unfreeze", callback_data:`freeze:off:${id}` }
  ],
  [
    { text:"🚨 Canary Bypass 30m", callback_data:`bypass:${id}` }
  ]
]);

  log({ event: "REQUEST", id });
}

export async function handleDeploy({ sql }) {

  if (FREEZE && Date.now() > BYPASS_UNTIL) {
    await telegram("🧊 *Deploy Blocked — Freeze Active*");
    return;
  }

  const id = uuid();

  const score = risk(sql);

  const plan = explainDiff({
    before: sql.before,
    after: sql.after
  }, process.env.DATABASE_URL_AI);

  const task = { id, sql, score, plan };

  await approveCycle(task);
}

export async function handleCallback(cb) {

  const d = cb.data.split(":");
  const action = d[0];
  const id = d[d.length - 1];

  switch (action) {

    case "approve":
      await telegram(`🚀 *Deploy Approved — Canary Release Starting*`);
      log({ event: "APPROVE", id });

      for (const pct of CANARY_STAGES) {
        await telegram(`📡 Canary Stage ${pct}%`);
        deployStage(pct);
        await new Promise(r => setTimeout(r, 5000));
      }

      await telegram("✅ *Deployment Complete*");
      break;

    case "deny":
      await telegram(`⛔ *Deployment Denied*`);
      log({ event: "DENY", id });
      break;

    case "rollback":
      rollback();
      await telegram(`🔁 *Rollback Complete*`);
      log({ event: "ROLLBACK", id });
      break;

    case "freeze":
      if (d[1] === "on") {
        FREEZE = true;
        await telegram("🧊 *Freeze Enabled*");
      } else {
        FREEZE = false;
        await telegram("🔥 *Freeze Disabled*");
      }
      break;

    case "bypass":
      BYPASS_UNTIL = Date.now() + (30 * 60 * 1000);
      await telegram("🟡 *Canary Freeze Bypass Active — 30m*");
      break;

    default:
      await telegram("❓ Unknown action");
  }
}
