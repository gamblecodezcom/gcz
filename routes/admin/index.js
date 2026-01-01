import express from "express";
import adminAuth from "../../middleware/adminAuth.js";
import {
  requireAdmin,
  requireSuperAdmin,
  requirePromoApproval,
  requireAffiliateOwner
} from "../../middleware/rbac.js";

import promosRouter from "./promos.js";
import affiliatesRouter from "./affiliates.js";
import dropsRouter from "./drops.js";

const router = express.Router();

// All admin routes require authentication
router.use(adminAuth);

// Affiliate management — ONLY YOU
router.use("/affiliates", requireAffiliateOwner, affiliatesRouter);

// Promo approval — ADMINS+
router.use("/promos", requirePromoApproval, promosRouter);

// Drops system — ADMINS+
router.use("/drops", requireAdmin, dropsRouter);

export default router;
