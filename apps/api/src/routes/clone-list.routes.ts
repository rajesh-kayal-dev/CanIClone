import { Router } from "express";
import { listCloneListApps } from "../controllers/clone-list.controller.js";

const router = Router();
router.get("/", listCloneListApps);

export default router;
