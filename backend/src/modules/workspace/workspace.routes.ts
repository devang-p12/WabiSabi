import { Router } from "express";

import { createWorkspaceController, getUserWorkspacesController } from "./workspace.controller.js";

import { authenticate } from "../../middleware/auth.middleware.js";
import { getUserWorkspaces } from "./workspace.service.js";

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

export default router;