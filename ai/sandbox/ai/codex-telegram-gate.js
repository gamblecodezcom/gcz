import fs from "fs";
import fetch from "node-fetch";
import express from "express";

const FILE = "/tmp/gcz_approvals.json";
const BOT = process.env.TELEGRAM_BOT_TOKEN_SANDBOX;
const ADMIN = process.env.TELEGRAM_ADMIN_ID || "6668510825";
const API = `https://api.telegram.org/bot${BOT}`;

function load() {
  return fs.existsSync(FILE)
    ? JSON.parse(fs.readFileSync(FILE))
    : [];
}

function save(d) {
  fs.writeFileSync(FILE, JSON.stringify(d, null, 2));
}

async function telegram(chat, msg, extra = {}) {
  return fetch(`${API}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chat,
      text: msg,
      parse_mode: "Markdown",
      ...extra
    })
  });
}

export async function createRequest(payload, riskScore, plan = null) {
  let q = load();
  const id = q.length + 1;

  q.push({
    id,
    created: new Date().toISOString(),
    status: "pending",
    risk: riskScore,
    payload,
    plan,
    expires: Date.now() + 30 * 60 * 1000 // 30m timeout
  });

  save(q);

  const kb = {
    inline_keyboard: [
      [{ text: "✅ APPROVE", callback_data: `approve_${id}` }],
      [{ text: "❌ DENY", callback_data: `deny_${id}` }],
      [{ text: "🔁 ROLLBACK", callback_data: `rollback_${id}` }]
    ]
  };

  await telegram(
    ADMIN,
    `⚠️ *GCZ-AI CHANGE REQUEST*\n\nID: *${id}*\nRisk: *${riskScore}*\n\nReview + approve below.`,
    { reply_markup: kb }
  );

  return id;
}

export async function handleCallback(data) {
  let q = load();
  const [action, id] = data.split("_");
  const task = q.find(t => String(t.id) === String(id));

  if (!task) return;

  if (task.status !== "pending") return;

  if (Date.now() > task.expires) {
    task.status = "expired";
  } else {
    if (action === "approve") task.status = "approved";
    if (action === "deny") task.status = "denied";
    if (action === "rollback") task.status = "rollback";
  }

  task.updated = new Date().toISOString();
  save(q);

  await telegram(
    ADMIN,
    `📝 Change *${id}* status → *${task.status.toUpperCase()}*`
  );
}

// --- EXPRESS CALLBACK HANDLER ---

const app = express();
app.use(express.json());

app.post("/telegram/aibot", async (req, res) => {
  try {
    if (!req.body?.callback_query?.data)
      return res.json({ ok: true });

    await handleCallback(req.body.callback_query.data);

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.json({ ok: false });
  }
});

const PORT = process.env.TELEGRAM_WEBHOOK_PORT || 9099;

app.listen(PORT, () =>
  console.log("GCZ CI Telegram Gate listening on", PORT)
);
