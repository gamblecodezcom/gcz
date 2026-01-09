import { notify } from "./approvals.js";
import fs from "fs";
import fetch from "node-fetch";

const LOG = "/var/log/gcz/ai_policy.jsonl";
const ADMIN_CHAT = process.env.TELEGRAM_ADMIN_ID || "6668510825";
const BOT = process.env.TELEGRAM_BOT_TOKEN_SANDBOX;

function telegram(msg) {
  if (!BOT) return;
  fetch(`https://api.telegram.org/bot${BOT}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: ADMIN_CHAT, text: msg })
  }).catch(()=>{});
}

function audit(entry) {
  entry.ts = new Date().toISOString();
  fs.appendFileSync(LOG, JSON.stringify(entry) + "\n");
}

export function risk(sql) {
  let s = sql.toLowerCase();
  let score = 0;
  if (s.includes("drop")) score += 50;
  if (s.includes("alter")) score += 30;
  if (s.includes("delete")) score += 10;
  if (s.includes("truncate")) score += 30;
  if (s.includes("update")) score += 10;
  if (s.includes("insert")) score += 5;
  return score;
}

export function enforce(sql) {
  const score = risk(sql)
  audit({type:"sql_eval", sql, score})

  if (score >= GCZ_POLICY.maxRisk) {
    notify(sql, score)
    throw new Error("SQL REQUIRES HUMAN REVIEW")
  }

  return true
}

  if (score >= 50) {
    telegram("🚨 GCZ-AI BLOCKED HIGH-RISK SQL IN SANDBOX");
    throw new Error("SQL BLOCKED — HIGH RISK");
  }

  if (/alter|create|drop/i.test(sql)) {
    telegram("⚠️ GCZ-AI ATTEMPTED SCHEMA CHANGE — HUMAN REVIEW REQUIRED");
    throw new Error("DDL REQUIRES HUMAN APPROVAL");
  }

  return true;
}
