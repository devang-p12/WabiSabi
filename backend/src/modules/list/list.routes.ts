import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware.js";

import {
    createListController,
    deleteListController,
    getBoardListsController,
    updateListController,
} from "./list.controller.js";

const router = Router();

router.post(
    "/boards/:boardId/lists",
    authenticate,
    createListController
);

router.get(
    "/boards/:boardId/lists",
    authenticate,
    getBoardListsController
);

router.patch(
    "/lists/:listId",
    authenticate,
    updateListController
);

router.delete(
    "/lists/:listId",
    authenticate,
    deleteListController
);

export default router;