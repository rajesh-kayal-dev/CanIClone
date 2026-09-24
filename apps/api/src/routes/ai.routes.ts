import { Router } from "express";

import {
  generateAppAnalysis,
  getAppAnalysis,
} from "../controllers/analysis.controller.js";

const router = Router();

// Mounted at /api/apps — these are more specific than the apps router's
// "/:slug" so they are registered first.
router.get("/:slug/analysis", getAppAnalysis);
router.post("/:slug/analyze", generateAppAnalysis);

export default router;
