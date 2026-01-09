import fetch from "node-fetch";
import { log } from "../utils/logger.js";

const API = "https://gamblecodez.com/api/stats";

export async function getUserStats(userId) {
  try {
    const res = await fetch(`${API}/user/${userId}`);
    return await res.json();
  } catch (err) {
    log("stats", "Failed to load user stats", err);
    return {};
  }
}