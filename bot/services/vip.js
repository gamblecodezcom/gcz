import fetch from "node-fetch";
import { log } from "../utils/logger.js";
import { config } from "../config.js";

const API = `${config.API_BASE}/vip`;

export async function getVipStatus(telegramId) {
  try {
    const res = await fetch(`${API}/user/${telegramId}`);
    return await res.json();
  } catch (err) {
    log("vip", "Failed to fetch VIP status", err);
    return null;
  }
}