import fetch from "node-fetch";
import { log } from "../utils/logger";

const AI_URL = process.env.GCZ_AI_URL || "http://127.0.0.1:8010";

async function get(path: string) {
  const url = `${AI_URL}${path}`;
  log(`AI GET → ${url}`);
  const res = await fetch(url);
  return res.json();
}

async function post(path: string, body: any = {}) {
  const url = `${AI_URL}${path}`;
  log(`AI POST → ${url}`);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return res.json();
}

export const aiHealth = () => get("/status");
export const aiScan = () => post("/scan");
export const aiMemory = (category: string, message?: string, meta?: any) =>
  post("/memory", { category, message, meta });
export const aiAnomaly = (message: string, meta?: any) =>
  post("/anomaly", { message, meta });