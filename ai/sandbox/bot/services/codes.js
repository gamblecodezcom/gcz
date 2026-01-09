import fetch from "node-fetch";
import { log } from "../utils/logger.js";
import { config } from "../config.js";

const API = `${config.API_BASE}/codes`;

export async function redeemCode(telegramId, code) {
  try {
    const params = new URLSearchParams({
      telegram_id: String(telegramId),
      code
    });
    const res = await fetch(`${API}/redeem?${params.toString()}`, {
      method: "POST"
    });
    return await res.json();
  } catch (err) {
    log("codes", "Failed to redeem code", err);
    return { success: false, message: "Redemption failed." };
  }
}