import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import {
    getWorkspaceAnalyticsController,
    getBoardAnalyticsController,
} from "./analytics.controller.js";

const router = Router();

// Workspace-scoped analytics
router.get(
    "/workspaces/:workspaceId/analytics",
    authenticate,
    getWorkspaceAnalyticsController
);

// Board-scoped analytics
router.get(
    "/boards/:boardId/analytics",
    authenticate,
    getBoardAnalyticsController
);

export default router;
