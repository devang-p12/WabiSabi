import { Router } from "express";

import {
    createWorkspaceController,
    getUserWorkspacesController,
    getWorkspaceByIdController,
    updateWorkspaceController,
    deleteWorkspaceController,
    getWorkspaceMembersController,
    addWorkspaceMemberController,
    updateWorkspaceMemberController,
    removeWorkspaceMemberController
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
router.post(
    "/:workspaceId/members",
    authenticate,
    addWorkspaceMemberController
);

router.patch(
    "/:workspaceId/members/:userId",
    authenticate,
    updateWorkspaceMemberController
);

router.delete(
    "/:workspaceId/members/:userId",
    authenticate,
    removeWorkspaceMemberController
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