import fetch from "node-fetch";
import { logger } from "./logger.js";

export async function touchUser(user) {
  try {
    await fetch("https://gamblecodez.com/api/users/touch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telegram_id: user.id.toString(),
        username: user.username || null,
        first_name: user.first_name || null
      })
    });
  } catch (err) {
    logger.error("touchUser failed:", err);
  }
}

export async function setCwalletId(userId, id) {
  try {
    await fetch("https://gamblecodez.com/api/profile/set-cwallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, id })
    });
  } catch (err) {
    logger.error("setCwalletId failed:", err);
  }
}

export async function setRunewagerUsername(userId, username) {
  try {
    await fetch("https://gamblecodez.com/api/profile/set-runewager", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, username })
    });
  } catch (err) {
    logger.error("setRunewagerUsername failed:", err);
  }
}

export async function getUserProfile(userId) {
  try {
    const res = await fetch(`https://gamblecodez.com/api/profile/${userId}`);
    return res.json();
  } catch (err) {
    logger.error("getUserProfile failed:", err);
    return null;
  }
}
