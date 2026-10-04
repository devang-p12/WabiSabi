import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import {
    getBoardActivityLogsController,
    getTaskActivityLogsController,
} from "./activity.controller.js";

const router = Router();

router.get("/boards/:boardId/activity", authenticate, getBoardActivityLogsController);
router.get("/tasks/:taskId/activity", authenticate, getTaskActivityLogsController);

export default router;
