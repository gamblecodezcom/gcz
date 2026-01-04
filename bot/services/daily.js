import fetch from "node-fetch";
import { log } from "../utils/logger.js";
import { config } from "../config.js";

const API = `${config.API_BASE}/daily`;

export async function getDailySummary(telegramId) {
  try {
    const res = await fetch(`${API}/summary/${telegramId}`);
    return await res.json();
  } catch (err) {
    log("daily", "Failed to fetch daily summary", err);
    return null;
  }
}