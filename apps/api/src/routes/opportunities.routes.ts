import { Router } from "express";
import {
  listOpportunityRows,
  getOpportunity,
} from "../controllers/opportunities.controller.js";

const router = Router();

router.get("/", listOpportunityRows);
router.get("/:slug", getOpportunity);

export default router;
