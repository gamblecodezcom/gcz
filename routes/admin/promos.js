import express from "express";
import { approvePromo, listPendingPromos } from "../../services/promosService.js";
import { distributePromoToTelegram } from "../../bot/services/promos.js";

const router = express.Router();

// GET pending promos (admins)
router.get("/pending", async (req, res) => {
  try {
    const promos = await listPendingPromos();
    res.json({ success: true, promos });
  } catch (err) {
    console.error("Error listing promos:", err);
    res.status(500).json({ error: "Failed to load promos" });
  }
});

// Approve promo (admins)
router.post("/approve/:id", async (req, res) => {
  try {
    const promoId = req.params.id;

    const promo = await approvePromo(promoId, req.adminUser.id);

    // Auto‑distribute to Telegram
    await distributePromoToTelegram(promo);

    res.json({ success: true, promo });
  } catch (err) {
    console.error("Promo approval error:", err);
    res.status(500).json({ error: "Failed to approve promo" });
  }
});

export default router;
