import fetch from "node-fetch";
import { log } from "../utils/logger.js";

// -------------------------------------
// CONFIG
// -------------------------------------
const API_BASE = "https://gamblecodez.com/api/autoresponses";

// Cache autoresponses to reduce API load
let cache = [];
let lastFetch = 0;
const CACHE_TTL = 15_000; // 15 seconds

// -------------------------------------
// API SERVICE
// -------------------------------------
export const AutoResponseService = {
  async getAll(force = false) {
    try {
      const now = Date.now();

      // Use cache if fresh
      if (!force && now - lastFetch < CACHE_TTL && cache.length > 0) {
        return cache;
      }

      const res = await fetch(`${API_BASE}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      cache = Array.isArray(data) ? data : [];
      lastFetch = now;

      return cache;
    } catch (err) {
      log("autoresponses", "Failed to fetch autoresponses", err);
      return cache; // fallback to stale cache
    }
  },

  async add(trigger, response, buttons = []) {
    try {
      const res = await fetch(`${API_BASE}/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trigger, response, buttons })
      });

      const data = await res.json();
      await this.getAll(true); // refresh cache
      return data;
    } catch (err) {
      log("autoresponses", "Failed to add autoresponse", err);
      return { error: true };
    }
  },

  async delete(trigger) {
    try {
      const res = await fetch(`${API_BASE}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trigger })
      });

      const data = await res.json();
      await this.getAll(true); // refresh cache
      return data;
    } catch (err) {
      log("autoresponses", "Failed to delete autoresponse", err);
      return { error: true };
    }
  }
};

// -------------------------------------
// STATE MACHINE FOR SETUP FLOW
// -------------------------------------
const setupState = new Map();

/**
 * Start autoresponse setup
 */
export function startReplySetup(ctx, keyword) {
  setupState.set(ctx.from.id, {
    step: "await_message",
    keyword,
    message: null,
    buttons: []
  });

  ctx.reply(
    `🛠 *Auto‑Response Setup Started*\n\n` +
    `Keyword: *${keyword}*\n\n` +
    `Reply to ANY message with the content you want to save.`,
    { parse_mode: "Markdown" }
  );
}

/**
 * Handle inline button actions during setup
 */
export async function handleSetupAction(bot, ctx) {
  const userId = ctx.from.id;
  const state = setupState.get(userId);
  if (!state) return ctx.answerCbQuery("No active setup.");

  const action = ctx.callbackQuery.data;

  switch (action) {
    case "ar_add_button":
      state.step = "await_button";
      return ctx.reply(
        "Send button in format:\n\n`Button Text | https://example.com`",
        { parse_mode: "Markdown" }
      );

    case "ar_save":
      if (!state.message) {
        return ctx.reply("❌ You must reply to a message first.");
      }

      await AutoResponseService.add(state.keyword, state.message, state.buttons);
      setupState.delete(userId);

      return ctx.reply("✅ Auto‑response saved successfully.");

    case "ar_cancel":
      setupState.delete(userId);
      return ctx.reply("❌ Setup cancelled.");

    default:
      return ctx.answerCbQuery("Unknown action.");
  }
}

/**
 * Handle button input during setup
 */
export async function handleButtonInput(ctx) {
  const userId = ctx.from.id;
  const state = setupState.get(userId);

  if (!state || state.step !== "await_button") return;

  const text = ctx.message.text;
  if (!text.includes("|")) {
    return ctx.reply(
      "❌ Invalid format.\nUse:\n`Button Text | https://url.com`",
      { parse_mode: "Markdown" }
    );
  }

  const [label, url] = text.split("|").map((s) => s.trim());
  state.buttons.push({ label, url });
  state.step = "await_message";

  ctx.reply(
    `Button added:\n*${label}* → ${url}\n\nAdd more or press Save.`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "➕ Add Button", callback_data: "ar_add_button" }],
          [{ text: "💾 Save", callback_data: "ar_save" }],
          [{ text: "❌ Cancel", callback_data: "ar_cancel" }]
        ]
      }
    }
  );
}

/**
 * Handle autoresponse message triggers
 */
export async function handleAutoResponse(bot, ctx) {
  const text = ctx.message?.text?.toLowerCase();
  if (!text) return;

  const all = await AutoResponseService.getAll();
  if (!all.length) return;

  // Fast match: find first trigger contained in message
  const match = all.find((r) =>
    text.includes(r.trigger.toLowerCase())
  );

  if (!match) return;

  const buttons = match.buttons?.length
    ? {
        reply_markup: {
          inline_keyboard: match.buttons.map((b) => [
            { text: b.label, url: b.url }
          ])
        }
      }
    : {};

  try {
    await ctx.reply(match.response, {
      parse_mode: "Markdown",
      ...buttons
    });
  } catch (err) {
    log("autoresponses", "Failed to send autoresponse", err);
  }
}