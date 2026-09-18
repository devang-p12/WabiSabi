import { Router } from "express";

import {
    addLabelToTaskController,
    createLabelController,
    deleteLabelController,
    getLabels,
    removeLabelFromTaskController,
    updateLabelController,
} from "./label.controller.js";

import { authenticate } from "../../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get(
    "/boards/:boardId/labels",
    getLabels,
);

router.post(
    "/boards/:boardId/labels",
    createLabelController,
);

router.patch(
    "/labels/:labelId",
    updateLabelController,
);

router.delete(
    "/labels/:labelId",
    deleteLabelController,
);

router.post(
    "/tasks/:taskId/labels/:labelId",
    addLabelToTaskController,
);

router.delete(
    "/tasks/:taskId/labels/:labelId",
    removeLabelFromTaskController,
);

export default router;