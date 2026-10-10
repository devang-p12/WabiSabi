import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import {
    createProjectController,
    getWorkspaceProjectsController,
    getProjectController,
    updateProjectController,
    deleteProjectController,
    createMilestoneController,
    updateMilestoneController,
    deleteMilestoneController,
} from "./project.controller.js";

const router = Router();

// Workspace projects routes
router.post(
    "/workspaces/:workspaceId/projects",
    authenticate,
    createProjectController
);

router.get(
    "/workspaces/:workspaceId/projects",
    authenticate,
    getWorkspaceProjectsController
);

// Individual project routes
router.get(
    "/projects/:projectId",
    authenticate,
    getProjectController
);

router.patch(
    "/projects/:projectId",
    authenticate,
    updateProjectController
);

router.delete(
    "/projects/:projectId",
    authenticate,
    deleteProjectController
);

// Milestone routes
router.post(
    "/projects/:projectId/milestones",
    authenticate,
    createMilestoneController
);

router.patch(
    "/milestones/:milestoneId",
    authenticate,
    updateMilestoneController
);

router.delete(
    "/milestones/:milestoneId",
    authenticate,
    deleteMilestoneController
);

export default router;
