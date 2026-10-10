import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import {
    createProject,
    getWorkspaceProjects,
    getProject,
    updateProject,
    deleteProject,
    createMilestone,
    updateMilestone,
    deleteMilestone,
} from "./project.service.js";
import {
    createProjectSchema,
    updateProjectSchema,
    createMilestoneSchema,
    updateMilestoneSchema,
} from "./project.validation.js";

export const createProjectController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Authentication required." });
        }

        const workspaceId = Array.isArray(req.params.workspaceId)
            ? req.params.workspaceId[0]
            : req.params.workspaceId;

        if (!workspaceId) {
            return res.status(400).json({ success: false, message: "Invalid workspace ID." });
        }

        const parsed = createProjectSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ success: false, message: parsed.error.issues[0]?.message });
        }

        const result = await createProject(workspaceId, req.userId, parsed.data);
        if ("error" in result) {
            return res.status(403).json({ success: false, message: result.error });
        }

        return res.status(201).json({ success: true, data: result.project });
    } catch (error) {
        console.error("Create project error:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

export const getWorkspaceProjectsController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Authentication required." });
        }

        const workspaceId = Array.isArray(req.params.workspaceId)
            ? req.params.workspaceId[0]
            : req.params.workspaceId;

        if (!workspaceId) {
            return res.status(400).json({ success: false, message: "Invalid workspace ID." });
        }

        const result = await getWorkspaceProjects(workspaceId, req.userId);
        if ("error" in result) {
            return res.status(403).json({ success: false, message: result.error });
        }

        return res.status(200).json({ success: true, data: result.projects });
    } catch (error) {
        console.error("Get workspace projects error:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

export const getProjectController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Authentication required." });
        }

        const projectId = Array.isArray(req.params.projectId)
            ? req.params.projectId[0]
            : req.params.projectId;

        if (!projectId) {
            return res.status(400).json({ success: false, message: "Invalid project ID." });
        }

        const result = await getProject(projectId, req.userId);
        if ("error" in result) {
            const status = result.error === "Project not found." ? 404 : 403;
            return res.status(status).json({ success: false, message: result.error });
        }

        return res.status(200).json({ success: true, data: result.project });
    } catch (error) {
        console.error("Get project error:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

export const updateProjectController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Authentication required." });
        }

        const projectId = Array.isArray(req.params.projectId)
            ? req.params.projectId[0]
            : req.params.projectId;

        if (!projectId) {
            return res.status(400).json({ success: false, message: "Invalid project ID." });
        }

        const parsed = updateProjectSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ success: false, message: parsed.error.issues[0]?.message });
        }

        const result = await updateProject(projectId, req.userId, parsed.data);
        if ("error" in result) {
            const status = result.error === "Project not found." ? 404 : 403;
            return res.status(status).json({ success: false, message: result.error });
        }

        return res.status(200).json({ success: true, data: result.project });
    } catch (error) {
        console.error("Update project error:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

export const deleteProjectController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Authentication required." });
        }

        const projectId = Array.isArray(req.params.projectId)
            ? req.params.projectId[0]
            : req.params.projectId;

        if (!projectId) {
            return res.status(400).json({ success: false, message: "Invalid project ID." });
        }

        const result = await deleteProject(projectId, req.userId);
        if ("error" in result) {
            const status = result.error === "Project not found." ? 404 : 403;
            return res.status(status).json({ success: false, message: result.error });
        }

        return res.status(200).json({ success: true, message: "Project deleted successfully." });
    } catch (error) {
        console.error("Delete project error:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

// --- Milestone Controllers ---

export const createMilestoneController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Authentication required." });
        }

        const projectId = Array.isArray(req.params.projectId)
            ? req.params.projectId[0]
            : req.params.projectId;

        if (!projectId) {
            return res.status(400).json({ success: false, message: "Invalid project ID." });
        }

        const parsed = createMilestoneSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ success: false, message: parsed.error.issues[0]?.message });
        }

        const result = await createMilestone(projectId, req.userId, parsed.data);
        if ("error" in result) {
            return res.status(403).json({ success: false, message: result.error });
        }

        return res.status(201).json({ success: true, data: result.milestone });
    } catch (error) {
        console.error("Create milestone error:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

export const updateMilestoneController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Authentication required." });
        }

        const milestoneId = Array.isArray(req.params.milestoneId)
            ? req.params.milestoneId[0]
            : req.params.milestoneId;

        if (!milestoneId) {
            return res.status(400).json({ success: false, message: "Invalid milestone ID." });
        }

        const parsed = updateMilestoneSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ success: false, message: parsed.error.issues[0]?.message });
        }

        const result = await updateMilestone(milestoneId, req.userId, parsed.data);
        if ("error" in result) {
            const status = result.error === "Milestone not found." ? 404 : 403;
            return res.status(status).json({ success: false, message: result.error });
        }

        return res.status(200).json({ success: true, data: result.milestone });
    } catch (error) {
        console.error("Update milestone error:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

export const deleteMilestoneController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Authentication required." });
        }

        const milestoneId = Array.isArray(req.params.milestoneId)
            ? req.params.milestoneId[0]
            : req.params.milestoneId;

        if (!milestoneId) {
            return res.status(400).json({ success: false, message: "Invalid milestone ID." });
        }

        const result = await deleteMilestone(milestoneId, req.userId);
        if ("error" in result) {
            const status = result.error === "Milestone not found." ? 404 : 403;
            return res.status(status).json({ success: false, message: result.error });
        }

        return res.status(200).json({ success: true, message: "Milestone deleted successfully." });
    } catch (error) {
        console.error("Delete milestone error:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};
