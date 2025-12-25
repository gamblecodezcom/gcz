
import express from "express";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import fetch from "node-fetch";
dotenv.config();

const app = express();
app.use(express.json());

// ===== Startup Validation =====
const REQUIRED_ENV = ["DATABASE_URL", "ADMIN_TOKEN", "PORT"];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`[FATAL] Missing env var: ${key}`);
    process.exit(1);
  }
}

const CSV_PATH = path.join(process.cwd(), "master_affiliates.csv");
if (!fs.existsSync(CSV_PATH)) {
  console.error("[FATAL] master_affiliates.csv missing");
  process.exit(1);
}

// ===== Routes =====
import auth from "./middleware/auth.js";
import affiliates from "./routes/affiliates.js";
import raffles from "./routes/raffles.js";
import newsletter from "./routes/newsletter.js";
import stats from "./routes/stats.js";

app.use("/api/affiliates", affiliates);
app.use("/api/raffles", auth, raffles);
app.use("/api/newsletter", newsletter);
app.use("/api/stats", stats);

// ===== Health =====
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "node-api", time: new Date().toISOString() });
});

app.get("/system/status", async (req, res) => {
  let redirect = false;
  try {
    const r = await fetch("http://127.0.0.1:8000/health");
    redirect = r.ok;
  } catch {}
  res.json({
    node: true,
    csv: fs.existsSync("master_affiliates.csv"),
    redirect
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API listening on ${PORT}`));
