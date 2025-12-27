const db = require("../models/spinLog");
const moment = require("moment");

exports.checkEligibility = async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: "Missing user_id" });

  const lastSpin = await db.getLastSpin(user_id);
  const now = moment.utc();

  if (lastSpin && moment.utc(lastSpin.timestamp).isAfter(now.subtract(24, "hours"))) {
    const nextSpin = moment.utc(lastSpin.timestamp).add(24, "hours");
    return res.json({ eligible: false, nextSpin: nextSpin.toISOString() });
  }

  res.json({ eligible: true });
};

exports.spinWheel = async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: "Missing user_id" });

  const lastSpin = await db.getLastSpin(user_id);
  const now = moment.utc();

  if (lastSpin && moment.utc(lastSpin.timestamp).isAfter(now.subtract(24, "hours"))) {
    const nextSpin = moment.utc(lastSpin.timestamp).add(24, "hours");
    return res.status(403).json({ error: "Already spun", nextSpin: nextSpin.toISOString() });
  }

  const reward = spinPrize(); // Random prize logic
  await db.logSpin(user_id, reward);

  res.json({ success: true, reward, message: `You won ${reward}!` });
};

function spinPrize() {
  const rewards = ["1 SC", "5 SC", "Try Again", "10 SC", "Bonus Entry"];
  return rewards[Math.floor(Math.random() * rewards.length)];
}
