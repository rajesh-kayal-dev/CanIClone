import { Router } from "express";

import {
  generateAppAnalysis,
  getAppAnalysis,
} from "../controllers/ai/analysis.controller.js";
import {
  acceptAppPromptHandler,
  getAppAIWorkspaceHandler,
} from "../controllers/ai/app-ai.controller.js";

const router = Router();

// Mounted at /api/apps — these are more specific than the apps router's
// "/:slug" so they are registered first.
router.get("/:slug/ai", getAppAIWorkspaceHandler);
router.patch("/:slug/ai/prompt", acceptAppPromptHandler);
router.get("/:slug/analysis", getAppAnalysis);
router.post("/:slug/analyze", generateAppAnalysis);

export default router;
