import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";

import {
    getBoardController,
    updateBoardController,
    deleteBoardController,
} from "./board.controller.js";

const router = Router();

router.get(
    "/:boardId",
    authenticate,
    getBoardController
);

router.patch(
    "/:boardId",
    authenticate,
    updateBoardController
);

router.delete(
    "/:boardId",
    authenticate,
    deleteBoardController
);

export default router;