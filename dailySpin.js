import express from "express";
import { handleDailySpin } from "../controllers/dailySpinController.js";

const router = express.Router();

// POST /api/daily/spin
router.post("/spin", handleDailySpin);

export default router;