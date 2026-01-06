import fetch from "node-fetch";
import { log } from "../utils/logger.js";
import { config } from "../config.js";

const API = `${config.API_BASE}/raffles`;

export async function getActiveRaffles() {
  try {
    const res = await fetch(`${API}/active`);
    return await res.json();
  } catch (err) {
    log("raffles", "Failed to load active raffles", err);
    return [];
  }
}

export async function enterRaffle(telegramId, raffleId) {
  try {
    const res = await fetch(`${API}/enter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId, raffleId })
    });
    return await res.json();
  } catch (err) {
    log("raffles", "Failed to enter raffle", err);
    return { success: false };
  }
}