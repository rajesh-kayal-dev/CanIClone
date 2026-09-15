import { Router } from "express";
import {
  listApps,
  getApp,
  listAppAlternatives,
  listCategories,
  search
} from "../controllers/apps.controller.js";

const router = Router();

router.get("/", listApps);
router.get("/categories", listCategories);
router.get("/search", search);
router.get("/:slug/alternatives", listAppAlternatives);
router.get("/:slug", getApp);

export default router;