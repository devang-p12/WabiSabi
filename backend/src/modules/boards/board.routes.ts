import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";

import {
    createBoardController,
    getWorkspaceBoardsController,
} from "./board.controller.js";

const router = Router();

router.post(
    "/:workspaceId/boards",
    authenticate,
    createBoardController
);

router.get(
    "/:workspaceId/boards",
    authenticate,
    getWorkspaceBoardsController
);

export default router;