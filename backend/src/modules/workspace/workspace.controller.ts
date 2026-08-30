import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";

import {
    createWorkspaceSchema,
} from "./workspace.validation.js";

import {
    createWorkspace,
    getUserWorkspaces
} from "./workspace.service.js";

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