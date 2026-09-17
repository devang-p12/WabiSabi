import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware.js";

import {
    createTaskController,
    deleteTaskController,
    getListTasksController,
    getTaskController,
    updateTaskController,
    moveTaskController
} from "./task.controller.js";

const router = Router();

router.post(
    "/lists/:listId/tasks",
    authenticate,
    createTaskController
);

router.get(
    "/lists/:listId/tasks",
    authenticate,
    getListTasksController
);

router.get(
    "/tasks/:taskId",
    authenticate,
    getTaskController
);

router.patch(
    "/tasks/:taskId",
    authenticate,
    updateTaskController
);

router.delete(
    "/tasks/:taskId",
    authenticate,
    deleteTaskController
);

router.patch(
    "/tasks/:taskId/move",
    authenticate,
    moveTaskController
);

export default router;