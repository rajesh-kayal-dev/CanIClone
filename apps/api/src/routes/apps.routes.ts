import { Router } from "express";
import {
  getApp,
  getAppStats,
  getCategory,
  listAppAlternatives,
  listApps,
  listCategories,
  listRelatedApps,
  search,
} from "../controllers/apps/apps.controller.js";

const router = Router();

// Keep collection routes before /:slug routes.
router.get("/categories", listCategories);
router.get("/categories/:slug", getCategory);
router.get("/stats", getAppStats);
router.get("/search", search);
router.get("/", listApps);
router.get("/:slug/alternatives", listAppAlternatives);
router.get("/:slug/related", listRelatedApps);
router.get("/:slug", getApp);

export default router;
