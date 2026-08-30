import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";

import {
    createWorkspaceSchema,
    updateWorkspaceSchema
} from "./workspace.validation.js";

import {
    createWorkspace,
    getUserWorkspaces,
    getWorkspaceById,
    updateWorkspace,
    deleteWorkspace,
    getWorkspaceMembers
} from "./workspace.service.js";

import {
    requireWorkspaceAdmin,
    requireWorkspaceOwner,
    getWorkspaceMembership
} from "./workspace.authorization.js";

export const createWorkspaceController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    if (!req.userId) {
        res.status(401).json({
            success: false,
            error: {
                code: "UNAUTHORIZED",
                message: "Authentication required.",
            },
        });

        return;
    }

    const data =
        createWorkspaceSchema.parse(req.body);

    const workspace =
        await createWorkspace(
            req.userId,
            data
        );

    res.status(201).json({
        success: true,
        data: {
            workspace,
        },
    });
};

export const getUserWorkspacesController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    if (!req.userId) {
        res.status(401).json({
            success: false,
            error: {
                code: "UNAUTHORIZED",
                message: "Authentication required.",
            },
        });

        return;
    }

    const workspaces =
        await getUserWorkspaces(req.userId);

    res.status(200).json({
        success: true,
        data: {
            workspaces,
        },
    });
};

export const getWorkspaceByIdController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    if (!req.userId) {
        res.status(401).json({
            success: false,
            error: {
                code: "UNAUTHORIZED",
                message: "Authentication required.",
            },
        });

        return;
    }

    const { workspaceId } = req.params;

    if (typeof workspaceId !== "string") {
        res.status(400).json({
            success: false,
            error: {
                code: "INVALID_WORKSPACE_ID",
                message: "Invalid workspace ID.",
            },
        });

        return;
    }

    const workspace = await getWorkspaceById(
        workspaceId,
        req.userId
    );

    if (!workspace) {
        res.status(404).json({
            success: false,
            error: {
                code: "WORKSPACE_NOT_FOUND",
                message: "Workspace not found.",
            },
        });

        return;
    }

    res.status(200).json({
        success: true,
        data: {
            workspace,
        },
    });
};

export const updateWorkspaceController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    if (!req.userId) {
        res.status(401).json({
            success: false,
            error: {
                code: "UNAUTHORIZED",
                message: "Authentication required.",
            },
        });

        return;
    }

    const { workspaceId } = req.params;

    if (typeof workspaceId !== "string") {
        res.status(400).json({
            success: false,
            error: {
                code: "INVALID_WORKSPACE_ID",
                message: "Invalid workspace ID.",
            },
        });

        return;
    }

    const membership =
        await requireWorkspaceAdmin(
            workspaceId,
            req.userId
        );

    if (!membership) {
        res.status(403).json({
            success: false,
            error: {
                code: "FORBIDDEN",
                message:
                    "You do not have permission to update this workspace.",
            },
        });

        return;
    }

    const data =
        updateWorkspaceSchema.parse(req.body);

    const workspace =
        await updateWorkspace(
            workspaceId,
            data
        );

    res.status(200).json({
        success: true,
        data: {
            workspace,
        },
    });
};

export const deleteWorkspaceController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    if (!req.userId) {
        res.status(401).json({
            success: false,
            error: {
                code: "UNAUTHORIZED",
                message: "Authentication required.",
            },
        });

        return;
    }

    const { workspaceId } = req.params;

    if (typeof workspaceId !== "string") {
        res.status(400).json({
            success: false,
            error: {
                code: "INVALID_WORKSPACE_ID",
                message: "Invalid workspace ID.",
            },
        });

        return;
    }

    const membership =
        await requireWorkspaceOwner(
            workspaceId,
            req.userId
        );

    if (!membership) {
        res.status(403).json({
            success: false,
            error: {
                code: "FORBIDDEN",
                message:
                    "Only the workspace owner can delete this workspace.",
            },
        });

        return;
    }

    await deleteWorkspace(workspaceId);

    res.status(200).json({
        success: true,
        data: {
            message: "Workspace deleted successfully.",
        },
    });
};

export const getWorkspaceMembersController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    if (!req.userId) {
        res.status(401).json({
            success: false,
            error: {
                code: "UNAUTHORIZED",
                message: "Authentication required.",
            },
        });

        return;
    }

    const { workspaceId } = req.params;

    if (typeof workspaceId !== "string") {
        res.status(400).json({
            success: false,
            error: {
                code: "INVALID_WORKSPACE_ID",
                message: "Invalid workspace ID.",
            },
        });

        return;
    }

    const membership = await getWorkspaceMembership(
        workspaceId,
        req.userId
    );

    if (!membership) {
        res.status(404).json({
            success: false,
            error: {
                code: "WORKSPACE_NOT_FOUND",
                message: "Workspace not found.",
            },
        });

        return;
    }

    const members = await getWorkspaceMembers(
        workspaceId
    );

    res.status(200).json({
        success: true,
        data: {
            members,
        },
    });
};