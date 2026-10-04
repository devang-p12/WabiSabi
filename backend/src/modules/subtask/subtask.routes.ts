import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import {
    createSubtaskController,
    deleteSubtaskController,
    getSubtasksController,
    updateSubtaskController,
} from "./subtask.controller.js";

const router = Router();

router.get(
    "/tasks/:taskId/subtasks",
    authenticate,
    getSubtasksController
);

router.post(
    "/tasks/:taskId/subtasks",
    authenticate,
    createSubtaskController
);

router.patch(
    "/subtasks/:subtaskId",
    authenticate,
    updateSubtaskController
);

router.delete(
    "/subtasks/:subtaskId",
    authenticate,
    deleteSubtaskController
);

export default router;
