import fetch from "node-fetch";
import { log } from "../utils/logger.js";
import { config } from "../config.js";

const API = `${config.API_BASE}`;

export async function getPoints(telegramId) {
  try {
    const res = await fetch(`${API}/points/balance/${telegramId}`);
    return await res.json();
  } catch (err) {
    log("points", "Failed to fetch points", err);
    return { balance: 0, lifetime_earned: 0, lifetime_spent: 0 };
  }
}

export async function changePoints(telegramId, delta, reason = "") {
  try {
    const params = new URLSearchParams({
      telegram_id: String(telegramId),
      delta: String(delta),
      reason
    });
    const res = await fetch(`${API}/points/change?${params.toString()}`, {
      method: "POST"
    });
    return await res.json();
  } catch (err) {
    log("points", "Failed to change points", err);
    return null;
  }
}