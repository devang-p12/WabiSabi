import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { getTodayPlanController } from "./planner.controller.js";

const router = Router();

router.get("/today", authenticate, getTodayPlanController);

export default router;
