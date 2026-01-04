import fetch from "node-fetch";
import { log } from "../utils/logger.js";
import { config } from "../config.js";

const API = `${config.API_BASE}/drops`;

export async function getLatestDrops(limit = 10) {
  try {
    const res = await fetch(`${API}/latest?limit=${limit}`);
    return await res.json();
  } catch (err) {
    log("drops", "Failed to load drops", err);
    return [];
  }
}