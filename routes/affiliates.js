
import express from "express";
import { validateAffiliateCSV } from "../utils/validateCsv.js";
const router = express.Router();

validateAffiliateCSV("master_affiliates.csv");

router.get("/", (req, res) => {
  res.json({ status: "ok", affiliates: [] });
});

export default router;
