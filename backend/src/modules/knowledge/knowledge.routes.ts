import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import {
    searchWorkspaceKnowledgeController,
    askWorkspaceKnowledgeController,
    indexResourceController,
} from "./knowledge.controller.js";

const router = Router();

// Semantic search across workspace documents and pages
router.get(
    "/workspaces/:workspaceId/knowledge/search",
    authenticate,
    searchWorkspaceKnowledgeController
);

// Ask question grounded on workspace knowledge (RAG)
router.post(
    "/workspaces/:workspaceId/knowledge/ask",
    authenticate,
    askWorkspaceKnowledgeController
);

// Trigger re-indexing for a document or page
router.post(
    "/workspaces/:workspaceId/knowledge/index",
    authenticate,
    indexResourceController
);

export default router;
