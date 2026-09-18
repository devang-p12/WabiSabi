import type { Response } from "express";

import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";

import { createLabel, deleteLabel, getBoardLabels, updateLabel , addLabelToTask, removeLabelFromTask } from "./label.service.js";

import { createLabelSchema, updateLabelSchema } from "./label.validation.js";


const getParam = (
    value: string | string[] | undefined,
): string | null => {
    if (typeof value !== "string") {
        return null;
    }

    return value;
};


export const getLabels = async (
    req: AuthenticatedRequest,
    res: Response,
) => {
    try {
        const boardId = getParam(req.params.boardId);

        if (!boardId) {
            return res.status(400).json({
                success: false,
                message: "Invalid board ID",
            });
        }

        const labels = await getBoardLabels(boardId);


        return res.status(200).json({
            success: true,
            data: {
                labels,
            },
        });
    } catch (error) {
        console.error("Failed to get labels:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to get labels",
        });
    }
};

export const createLabelController = async (
    req: AuthenticatedRequest,
    res: Response,
) => {
    try {
        const boardId = getParam(req.params.boardId);

        if (!boardId) {
            return res.status(400).json({
                success: false,
                message: "Invalid board ID",
            });
        }

        const result = createLabelSchema.safeParse(
            req.body,
        );

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid label data",
                errors: result.error.flatten(),
            });
        }

        const label = await createLabel(
            boardId,
            result.data,
        );

        return res.status(201).json({
            success: true,
            data: {
                label,
            },
        });
    } catch (error: any) {
        console.error("Failed to create label:", error);

        if (error?.code === "P2002") {
            return res.status(409).json({
                success: false,
                message:
                    "A label with this name already exists on this board",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create label",
        });
    }
};

export const updateLabelController = async (
    req: AuthenticatedRequest,
    res: Response,
) => {
    try {
        const labelId = getParam(req.params.labelId);

        if (!labelId) {
            return res.status(400).json({
                success: false,
                message: "Invalid label ID",
            });
        }

        const result = updateLabelSchema.safeParse(
            req.body,
        );

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid label data",
                errors: result.error.flatten(),
            });
        }

        const label = await updateLabel(
            labelId,
            result.data,
        );

        return res.status(200).json({
            success: true,
            data: {
                label,
            },
        });
    } catch (error: any) {
        console.error("Failed to update label:", error);

        if (error?.code === "P2002") {
            return res.status(409).json({
                success: false,
                message:
                    "A label with this name already exists on this board",
            });
        }

        if (error?.code === "P2025") {
            return res.status(404).json({
                success: false,
                message: "Label not found",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update label",
        });
    }
};

export const deleteLabelController = async (
    req: AuthenticatedRequest,
    res: Response,
) => {
    try {
        const labelId = getParam(req.params.labelId);

        if (!labelId) {
            return res.status(400).json({
                success: false,
                message: "Invalid label ID",
            });
        }

        await deleteLabel(labelId);

        return res.status(200).json({
            success: true,
            message: "Label deleted successfully",
        });
    } catch (error: any) {
        console.error("Failed to delete label:", error);

        if (error?.code === "P2025") {
            return res.status(404).json({
                success: false,
                message: "Label not found",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to delete label",
        });
    }
};

export const addLabelToTaskController = async (
    req: AuthenticatedRequest,
    res: Response,
) => {
    try {
        const taskId = getParam(req.params.taskId);
        const labelId = getParam(req.params.labelId);

        if (!taskId || !labelId) {
            return res.status(400).json({
                success: false,
                message: "Invalid task ID or label ID",
            });
        }

        const taskLabel = await addLabelToTask(
            taskId,
            labelId,
        );

        return res.status(201).json({
            success: true,
            data: {
                taskLabel,
            },
        });
    } catch (error: any) {
        console.error(
            "Failed to add label to task:",
            error,
        );

        if (error?.code === "P2002") {
            return res.status(409).json({
                success: false,
                message:
                    "Label is already assigned to this task",
            });
        }

        if (error?.code === "P2003") {
            return res.status(404).json({
                success: false,
                message:
                    "Task or label not found",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to add label to task",
        });
    }
};

export const removeLabelFromTaskController = async (
    req: AuthenticatedRequest,
    res: Response,
) => {
    try {
        const taskId = getParam(req.params.taskId);
        const labelId = getParam(req.params.labelId);

        if (!taskId || !labelId) {
            return res.status(400).json({
                success: false,
                message: "Invalid task ID or label ID",
            });
        }

        await removeLabelFromTask(
            taskId,
            labelId,
        );

        return res.status(200).json({
            success: true,
            message: "Label removed from task",
        });
    } catch (error: any) {
        console.error(
            "Failed to remove label from task:",
            error,
        );

        if (error?.code === "P2025") {
            return res.status(404).json({
                success: false,
                message:
                    "Task label relationship not found",
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Failed to remove label from task",
        });
    }
};