/* utils/dropEngine.js
   GambleCodez Drop Engine — AI‑Powered, Privacy‑Safe, Pipeline‑Ready, ESM‑Safe
*/

import logger from "./logger.js";
import crypto from "crypto";

// ---------- In‑memory dedupe cache (non‑fatal) ----------
const RECENT_HASHES = new Set();
const RECENT_LIMIT = 500;
const recentQueue = [];

// ---------- Optional AI client (OpenAI‑style) ----------
let aiClient = null;

async function initAI() {
  if (aiClient) return aiClient;

  const apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
  if (!apiKey) {
    logger.warn("DropEngine: No AI API key found, using fallback classifier");
    return null;
  }

  try {
    const { default: OpenAI } = await import("openai");
    aiClient = new OpenAI({ apiKey });
    logger.info("DropEngine: AI client initialized");
    return aiClient;
  } catch (err) {
    logger.error("DropEngine: Failed to initialize AI client:", err.message || err);
    aiClient = null;
    return null;
  }
}

// ---------- Privacy & sanitization ----------
function sanitizeText(rawText) {
  if (!rawText) return "";
  let text = String(rawText);

  // Remove Discord-style mentions and IDs
  text = text.replace(/<@[!&]?\d+>/g, "[user]");
  text = text.replace(/<#[0-9]+>/g, "[channel]");

  // Remove @usernames and #channels
  text = text.replace(/@\w{2,32}/g, "[user]");
  text = text.replace(/#\w{2,64}/g, "[channel]");

  // Remove Discord invites
  text = text.replace(/https?:\/\/(www\.)?discord\.gg\/[A-Za-z0-9]+/gi, "[invite]");
  text = text.replace(/discord\.gg\/[A-Za-z0-9]+/gi, "[invite]");

  // Remove custom emojis
  text = text.replace(/<a?:\w+:\d+>/g, "[emoji]");

  // Remove weird symbols
  text = text.replace(/<+[-=]+>+/g, " ");
  text = text.replace(/[-=_]{3,}/g, " ");
  text = text.replace(/\s{2,}/g, " ").trim();

  return text;
}

// ---------- Validation ----------
export function validateDrop(raw) {
  if (!raw) {
    logger.warn("validateDrop: empty payload");
    return { ok: false, error: "Empty payload" };
  }

  const sanitizedText = sanitizeText(raw.text || "");

  const drop = {
    source: raw.source || "unknown",
    text: sanitizedText,
    user: null,
    timestamp: raw.timestamp || Date.now(),
    meta: {
      ...((raw.meta && typeof raw.meta === "object") ? raw.meta : {}),
    },
  };

  if (!drop.text.trim()) {
    return { ok: false, error: "Missing drop text" };
  }

  return { ok: true, drop };
}

// ---------- Dedupe protection ----------
function hashDropText(text) {
  return crypto.createHash("sha256").update(text.trim().toLowerCase()).digest("hex");
}

function isDuplicate(drop) {
  try {
    const h = hashDropText(drop.text);
    if (RECENT_HASHES.has(h)) return true;

    RECENT_HASHES.add(h);
    recentQueue.push(h);

    if (recentQueue.length > RECENT_LIMIT) {
      const old = recentQueue.shift();
      RECENT_HASHES.delete(old);
    }

    return false;
  } catch (err) {
    logger.error("DropEngine: dedupe error:", err.message || err);
    return false;
  }
}

// ---------- Fallback classifier ----------
function fallbackClassify(drop) {
  const text = drop.text.toLowerCase();

  let category = "general";
  if (text.includes("raffle") || text.includes("ticket")) category = "raffle";
  else if (text.includes("promo") || text.includes("code")) category = "promo";
  else if (text.includes("bug") || text.includes("issue") || text.includes("error")) category = "bug";
  else if (text.includes("bot") || text.includes("telegram") || text.includes("discord")) category = "bot";

  return {
    ok: true,
    category,
    confidence: 0.6,
    drop,
    source: "fallback",
  };
}

// ---------- AI classifier ----------
export async function classifyDrop(drop) {
  try {
    const client = await initAI();
    if (!client) return fallbackClassify(drop);

    const prompt = `
You are a classifier for GambleCodez "drops".
Each drop is a short text about raffles, promos, bugs, bots, or general info.
The text has already been sanitized.

Classify into ONE category:
- "raffle"
- "promo"
- "bug"
- "bot"
- "general"

Return ONLY JSON:
{"category": "...", "confidence": 0.0}

Drop:
"""${drop.text}"""
    `.trim();

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Strict JSON only." },
        { role: "user", content: prompt },
      ],
      temperature: 0,
    });

    const raw = response.choices?.[0]?.message?.content?.trim() || "{}";
    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch {
      logger.warn("DropEngine: AI returned non-JSON:", raw);
      return fallbackClassify(drop);
    }

    return {
      ok: true,
      category: parsed.category || "general",
      confidence: parsed.confidence || 0.5,
      drop,
      source: "ai",
      raw,
    };
  } catch (err) {
    logger.error("DropEngine: AI classification failed:", err.message || err);
    return fallbackClassify(drop);
  }
}

// ---------- Pipelines / Hooks ----------
async function notifyAdminPanel(result) {
  try {
    logger.info("DropEngine: notifyAdminPanel:", result.category);
  } catch (err) {
    logger.error("notifyAdminPanel failed:", err.message || err);
  }
}

async function notifyBots(result) {
  try {
    logger.info("DropEngine: notifyBots:", result.category);
  } catch (err) {
    logger.error("notifyBots failed:", err.message || err);
  }
}

async function pushToFrontend(result) {
  try {
    logger.info("DropEngine: pushToFrontend:", result.category);
  } catch (err) {
    logger.error("pushToFrontend failed:", err.message || err);
  }
}

async function pushToTelegram(result) {
  try {
    logger.info("DropEngine: pushToTelegram:", result.category);
  } catch (err) {
    logger.error("pushToTelegram failed:", err.message || err);
  }
}

async function persistDrop(result) {
  try {
    logger.info("DropEngine: persistDrop:", {
      category: result.category,
      confidence: result.confidence,
      source: result.source,
    });
  } catch (err) {
    logger.error("persistDrop failed:", err.message || err);
  }
}

// ---------- Main pipeline ----------
export async function processDrop(raw) {
  logger.info("DropEngine: processDrop received");

  const v = validateDrop(raw);
  if (!v.ok) return { ok: false, stage: "validation", error: v.error };

  if (isDuplicate(v.drop)) {
    logger.warn("DropEngine: duplicate drop detected");
    return { ok: false, stage: "dedupe", error: "Duplicate drop" };
  }

  const c = await classifyDrop(v.drop);
  if (!c.ok) return { ok: false, stage: "classification", error: c.error };

  await persistDrop(c);
  await notifyAdminPanel(c);
  await notifyBots(c);
  await pushToFrontend(c);
  await pushToTelegram(c);

  return {
    ok: true,
    category: c.category,
    confidence: c.confidence,
    source: c.source,
    drop: c.drop,
  };
}

export default {
  validateDrop,
  classifyDrop,
  processDrop,
};
