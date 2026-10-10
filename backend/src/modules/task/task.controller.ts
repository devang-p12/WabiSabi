import type { Response } from "express";

import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";

import {
    createTask,
    deleteTask,
    getListTasks,
    getTask,
    updateTask,
    moveTask,
    createTaskDependency,
    getTaskDependencies,
    deleteTaskDependency,
} from "./task.service.js";

import {
    createTaskSchema,
    updateTaskSchema,
    moveTaskSchema,
    createTaskDependencySchema,
} from "./task.validation.js";

export const createTaskController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const listId = req.params.listId;

        if (!listId || Array.isArray(listId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid list ID.",
            });
        }

        const parsed = createTaskSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: parsed.error.issues[0]?.message,
            });
        }

        const result = await createTask(
            listId,
            req.userId,
            parsed.data
        );

        if ("error" in result) {
            const status =
                result.error === "List not found."
                    ? 404
                    : 403;

            return res.status(status).json({
                success: false,
                message: result.error,
            });
        }

        return res.status(201).json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error("Create task error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};

export const getListTasksController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const listId = req.params.listId;

        if (!listId || Array.isArray(listId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid list ID.",
            });
        }

        const result = await getListTasks(
            listId,
            req.userId
        );

        if ("error" in result) {
            const status =
                result.error === "List not found."
                    ? 404
                    : 403;

            return res.status(status).json({
                success: false,
                message: result.error,
            });
        }

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error("Get list tasks error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};

export const getTaskController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const taskId = req.params.taskId;

        if (!taskId || Array.isArray(taskId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid task ID.",
            });
        }

        const result = await getTask(
            taskId,
            req.userId
        );

        if ("error" in result) {
            const status =
                result.error === "Task not found."
                    ? 404
                    : 403;

            return res.status(status).json({
                success: false,
                message: result.error,
            });
        }

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error("Get task error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};

export const updateTaskController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const taskId = req.params.taskId;

        if (!taskId || Array.isArray(taskId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid task ID.",
            });
        }

        const parsed = updateTaskSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: parsed.error.issues[0]?.message,
            });
        }

        const result = await updateTask(
            taskId,
            req.userId,
            parsed.data
        );

        if ("error" in result) {
            const status =
                result.error === "Task not found."
                    ? 404
                    : 403;

            return res.status(status).json({
                success: false,
                message: result.error,
            });
        }

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error("Update task error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};

export const deleteTaskController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const taskId = req.params.taskId;

        if (!taskId || Array.isArray(taskId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid task ID.",
            });
        }

        const result = await deleteTask(
            taskId,
            req.userId
        );

        if ("error" in result) {
            const status =
                result.error === "Task not found."
                    ? 404
                    : 403;

            return res.status(status).json({
                success: false,
                message: result.error,
            });
        }

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error("Delete task error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};

export const moveTaskController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        const taskId = req.params.taskId;

        if (!taskId || Array.isArray(taskId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid task ID.",
            });
        }

        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized.",
            });
        }

        const validation =
            moveTaskSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid move data.",
                errors: validation.error.flatten(),
            });
        }

        const task = await moveTask(
            taskId,
            userId,
            validation.data.listId,
            validation.data.position
        );

        return res.status(200).json({
            success: true,
            message: "Task moved successfully.",
            data: task,
        });
    } catch (error) {
        console.error("Move task error:", error);

        return res.status(400).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to move task.",
        });
    }
};

export const createTaskDependencyController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const taskId = req.params.taskId;
        if (!taskId || Array.isArray(taskId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid task ID.",
            });
        }

        const parsed = createTaskDependencySchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: parsed.error.issues[0]?.message,
            });
        }

        const result = await createTaskDependency(
            taskId,
            parsed.data.dependsOnId,
            req.userId
        );

        if ("error" in result) {
            const status = result.error === "Dependency already exists." ? 409 : 400;
            return res.status(status).json({
                success: false,
                message: result.error,
            });
        }

        return res.status(201).json({
            success: true,
            data: result.dependency,
        });
    } catch (error) {
        console.error("Create task dependency error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};

export const getTaskDependenciesController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const taskId = req.params.taskId;
        if (!taskId || Array.isArray(taskId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid task ID.",
            });
        }

        const result = await getTaskDependencies(taskId, req.userId);
        if ("error" in result) {
            const status = result.error === "Task not found." ? 404 : 403;
            return res.status(status).json({
                success: false,
                message: result.error,
            });
        }

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error("Get task dependencies error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};

export const deleteTaskDependencyController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const taskId = req.params.taskId;
        const dependsOnId = req.params.dependsOnId;

        if (!taskId || Array.isArray(taskId) || !dependsOnId || Array.isArray(dependsOnId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid task ID or dependsOn ID.",
            });
        }

        const result = await deleteTaskDependency(
            taskId,
            dependsOnId,
            req.userId
        );

        if ("error" in result) {
            const status = result.error === "Dependency not found." ? 404 : 403;
            return res.status(status).json({
                success: false,
                message: result.error,
            });
        }

        return res.status(200).json({
            success: true,
            message: "Task dependency deleted successfully.",
        });
    } catch (error) {
        console.error("Delete task dependency error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};