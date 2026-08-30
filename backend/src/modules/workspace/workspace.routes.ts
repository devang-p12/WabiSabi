import { Router } from "express";

import {
    createWorkspaceController,
    getUserWorkspacesController,
    getWorkspaceByIdController,
    updateWorkspaceController,
    deleteWorkspaceController,
    getWorkspaceMembersController
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
    "/:workspaceId/members",
    authenticate,
    getWorkspaceMembersController
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

router.delete(
    "/:workspaceId",
    authenticate,
    deleteWorkspaceController
);



export default router;