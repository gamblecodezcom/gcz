import fetch from "node-fetch";
import { log } from "../utils/logger.js";
import { config } from "../config.js";

const API = `${config.API_BASE}/inbox`;

export async function getInbox(telegramId, limit = 20) {
  try {
    const res = await fetch(`${API}/user/${telegramId}?limit=${limit}`);
    return await res.json();
  } catch (err) {
    log("inbox", "Failed to fetch inbox", err);
    return [];
  }
}

export async function markRead(telegramId, messageId) {
  try {
    const params = new URLSearchParams({
      telegram_id: String(telegramId),
      message_id: String(messageId)
    });
    const res = await fetch(`${API}/read?${params.toString()}`, {
      method: "POST"
    });
    return await res.json();
  } catch (err) {
    log("inbox", "Failed to mark inbox message read", err);
    return null;
  }
}