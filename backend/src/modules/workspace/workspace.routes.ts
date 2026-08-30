import { Router } from "express";

import {
    createWorkspaceController,
    getUserWorkspacesController,
    getWorkspaceByIdController,
    updateWorkspaceController,
} from "./workspace.controller.js";

import { authenticate } from "../../middleware/auth.middleware.js";

const router = Router();

router.post(
    "/",
    authenticate,
    createWorkspaceController
);

router.get(
    "/",
    authenticate,
    getUserWorkspacesController
);

router.get(
    "/:workspaceId",
    authenticate,
    getWorkspaceByIdController
);

router.patch(
    "/:workspaceId",
    authenticate,
    updateWorkspaceController
);

export default router;