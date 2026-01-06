import fetch from "node-fetch";
import { log } from "../utils/logger.js";
import { config } from "../config.js";

const API = `${config.API_BASE}/giveaways`;

export async function getActiveGiveaways() {
  try {
    const res = await fetch(`${API}/active`);
    return await res.json();
  } catch (err) {
    log("giveaways", "Failed to load giveaways", err);
    return [];
  }
}

export async function enterGiveaway(telegramId, giveawayId) {
  try {
    const res = await fetch(`${API}/enter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId, giveawayId })
    });
    return await res.json();
  } catch (err) {
    log("giveaways", "Failed to enter giveaway", err);
    return { success: false };
  }
}