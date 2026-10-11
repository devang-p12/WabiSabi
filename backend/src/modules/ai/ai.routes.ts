import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import {
    analyzeProjectController,
    createProjectFromApprovedPlanController,
    generateAdaptiveReplanController,
    applyAdaptiveReplanController,
    getAIHealthController,
    testAIPromptController,
    orchestratePromptController,
    listToolsController,
    runAgentController,
    confirmAgentActionController,
} from "./ai.controller.js";

const router = Router();

// GET /api/v1/ai/health - Health check endpoint verifying Ollama / AI provider reachability
router.get("/health", getAIHealthController);

// GET /api/v1/ai/tools - List available backend tools
router.get("/tools", listToolsController);

// POST /api/v1/ai/workspaces/:workspaceId/orchestrate - Phase 13 tool orchestration cycle
router.post(
    "/workspaces/:workspaceId/orchestrate",
    authenticate,
    orchestratePromptController
);

// POST /api/v1/ai/workspaces/:workspaceId/agent/chat - Phase 14 Wabi Agent reasoning loop
router.post(
    "/workspaces/:workspaceId/agent/chat",
    authenticate,
    runAgentController
);

// POST /api/v1/ai/workspaces/:workspaceId/agent/confirm - Phase 14 Confirm action execution
router.post(
    "/workspaces/:workspaceId/agent/confirm",
    authenticate,
    confirmAgentActionController
);

// POST /api/v1/ai/projects/analyze - Analyzes project idea and produces structured project plan (analysis only)
router.post("/projects/analyze", analyzeProjectController);

// POST /api/v1/ai/projects/create-from-plan - Explicit user approval endpoint executing Prisma transaction
router.post(
    "/projects/create-from-plan",
    authenticate,
    createProjectFromApprovedPlanController
);

// POST /api/v1/ai/projects/:projectId/replan - Phase 9 Adaptive Replan generator
router.post(
    "/projects/:projectId/replan",
    authenticate,
    generateAdaptiveReplanController
);

// POST /api/v1/ai/projects/:projectId/replan/apply - Phase 9 Apply approved changes
router.post(
    "/projects/:projectId/replan/apply",
    authenticate,
    applyAdaptiveReplanController
);

// POST /api/v1/ai/test - Optional test endpoint to test text generation
router.post("/test", testAIPromptController);

export default router;
