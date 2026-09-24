import { Router } from "express";

import {
  capabilitiesHandler,
  createIdeaHandler,
  deleteIdeaHandler,
  getIdeaHandler,
  listIdeasHandler,
  updateIdeaHandler,
} from "../controllers/ideas.controller.js";

const router = Router();

// Static segments must precede the "/:id" wildcard.
router.get("/capabilities", capabilitiesHandler);
router.get("/", listIdeasHandler);
router.post("/", createIdeaHandler);
router.get("/:id", getIdeaHandler);
router.patch("/:id", updateIdeaHandler);
router.delete("/:id", deleteIdeaHandler);

export default router;
