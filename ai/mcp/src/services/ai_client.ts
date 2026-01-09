import fetch from "node-fetch";
import { log } from "../utils/logger";

const ENV = (process.env.GCZ_ENV || process.env.NODE_ENV || "production").toLowerCase();
const DEFAULT_AI_URL =
  ENV === "sandbox" ? "http://127.0.0.1:9010" : "http://127.0.0.1:8010";
const AI_URL = process.env.GCZ_AI_URL || DEFAULT_AI_URL;
const CONTROL_KEY = process.env.GCZ_CONTROL_KEY;

function authHeaders(): Record<string, string> {
  return CONTROL_KEY ? { "x-gcz-key": CONTROL_KEY } : {};
}

async function get(path: string) {
  const url = `${AI_URL}${path}`;
  log(`AI GET → ${url}`);
  const res = await fetch(url, {
    headers: authHeaders()
  });
  return res.json();
}

async function post(path: string, body: any = {}) {
  const url = `${AI_URL}${path}`;
  log(`AI POST → ${url}`);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
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
