import fetch from "node-fetch";
import { log } from "../utils/logger.js";

const API = "https://gamblecodez.com/api/wheel";

export async function spinWheel(userId) {
  try {
    const res = await fetch(`${API}/spin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });
    return await res.json();
  } catch (err) {
    log("wheel", "Wheel spin failed", err);
    return { success: false };
  }
}