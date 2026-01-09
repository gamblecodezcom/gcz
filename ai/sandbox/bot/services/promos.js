import fetch from "node-fetch";
import { log } from "../utils/logger.js";
import { config } from "../config.js";

const API = `${config.API_BASE}/promos`;

export async function getLivePromos() {
  try {
    const res = await fetch(`${API}/live`);
    return await res.json();
  } catch (err) {
    log("promos", "Failed to fetch promos", err);
    return [];
  }
}