import fetch from "node-fetch";
import { log } from "../utils/logger.js";
import { config } from "../config.js";

const API = `${config.API_BASE}/progress`;

export async function getUserProgress(telegramId) {
  try {
    const res = await fetch(`${API}/user/${telegramId}`);
    return await res.json();
  } catch (err) {
    log("progress", "Failed to load user progress", err);
    return null;
  }
}

export async function incrementProgress(telegramId, payload = {}) {
  try {
    const params = new URLSearchParams({
      telegram_id: telegramId,
      entries: String(payload.entries || 0),
      spins: String(payload.spins || 0),
      affiliate_clicks: String(payload.affiliateClicks || 0),
      giveaway_entries: String(payload.giveawayEntries || 0),
      giveaway_wins: String(payload.giveawayWins || 0)
    });

    const res = await fetch(`${API}/increment?${params.toString()}`, {
      method: "POST"
    });
    return await res.json();
  } catch (err) {
    log("progress", "Failed to increment progress", err);
    return null;
  }
}

export async function getLeaderboard(limit = 20) {
  try {
    const res = await fetch(`${API}/leaderboard?limit=${limit}`);
    return await res.json();
  } catch (err) {
    log("progress", "Failed to load leaderboard", err);
    return [];
  }
}