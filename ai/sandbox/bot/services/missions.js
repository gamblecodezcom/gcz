import fetch from "node-fetch";
import { log } from "../utils/logger.js";
import { config } from "../config.js";

const API = `${config.API_BASE}`;

export async function getTodayMissions(telegramId) {
  try {
    const res = await fetch(`${API}/missions/today/${telegramId}`);
    return await res.json();
  } catch (err) {
    log("missions", "Failed to fetch today missions", err);
    return null;
  }
}

export async function completeMission(telegramId, mission) {
  try {
    const params = new URLSearchParams({ telegram_id: telegramId, mission });
    const res = await fetch(`${API}/missions/complete?${params.toString()}`, {
      method: "POST"
    });
    return await res.json();
  } catch (err) {
    log("missions", "Failed to complete mission", err);
    return null;
  }
}