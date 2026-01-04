
import crypto from "crypto";

export default function auth(req, res, next) {
  const token = req.headers["x-admin-token"];
  const expected = process.env.ADMIN_TOKEN;

  if (!token || !expected) {
    return res.status(401).json({ error: "Admin token missing" });
  }

  const valid =
    token.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));

  if (!valid) {
    return res.status(403).json({ error: "Invalid admin token" });
  }

  next();
}
