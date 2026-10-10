import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware.js";

import {
    createTaskController,
    deleteTaskController,
    getListTasksController,
    getTaskController,
    updateTaskController,
    moveTaskController,
    createTaskDependencyController,
    getTaskDependenciesController,
    deleteTaskDependencyController,
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

// Task dependencies
router.post(
    "/tasks/:taskId/dependencies",
    authenticate,
    createTaskDependencyController
);

router.get(
    "/tasks/:taskId/dependencies",
    authenticate,
    getTaskDependenciesController
);

router.delete(
    "/tasks/:taskId/dependencies/:dependsOnId",
    authenticate,
    deleteTaskDependencyController
);

export default router;