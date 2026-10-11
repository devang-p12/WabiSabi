import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import {
    createPageController,
    getWorkspacePagesController,
    getPageController,
    updatePageController,
    deletePageController,
    createBlockController,
    updateBlockController,
    deleteBlockController,
    batchSaveBlocksController,
} from "./page.controller.js";

const router = Router();

// ==========================================
// Pages Routes
// ==========================================

// Workspace pages hierarchy
router.post(
    "/workspaces/:workspaceId/pages",
    authenticate,
    createPageController
);

router.get(
    "/workspaces/:workspaceId/pages",
    authenticate,
    getWorkspacePagesController
);

// Individual page operations
router.get(
    "/pages/:pageId",
    authenticate,
    getPageController
);

router.patch(
    "/pages/:pageId",
    authenticate,
    updatePageController
);

router.delete(
    "/pages/:pageId",
    authenticate,
    deletePageController
);

// ==========================================
// Blocks Routes
// ==========================================

// Page blocks
router.post(
    "/pages/:pageId/blocks",
    authenticate,
    createBlockController
);

router.put(
    "/pages/:pageId/blocks",
    authenticate,
    batchSaveBlocksController
);

// Individual block operations
router.patch(
    "/blocks/:blockId",
    authenticate,
    updateBlockController
);

router.delete(
    "/blocks/:blockId",
    authenticate,
    deleteBlockController
);

export default router;
