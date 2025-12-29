import express from "express";
import { handleDailySpin, checkEligibility } from "../controllers/dailySpinController.js";

const router = express.Router();

// GET /api/daily-spin/eligibility
router.get("/eligibility", checkEligibility);

// POST /api/daily-spin
router.post("/", handleDailySpin);
router.post("/spin", handleDailySpin);

export default router;