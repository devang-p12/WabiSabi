import { Router } from "express";

import { createWorkspaceController } from "./workspace.controller.js";

import { authenticate } from "../../middleware/auth.middleware.js";

const router = Router();

router.post(
    "/",
    authenticate,
    createWorkspaceController
);

export default router;