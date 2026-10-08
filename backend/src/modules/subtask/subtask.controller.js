import { createSubtask, deleteSubtask, getTaskSubtasks, updateSubtask, } from "./subtask.service.js";
import { createSubtaskSchema, updateSubtaskSchema, } from "./subtask.validation.js";
const getParam = (value) => {
    if (typeof value !== "string") {
        return null;
    }
    return value;
};
export const getSubtasksController = async (req, res) => {
    try {
        const taskId = getParam(req.params.taskId);
        if (!taskId) {
            return res.status(400).json({
                success: false,
                message: "Invalid task ID",
            });
        }
        const subtasks = await getTaskSubtasks(taskId);
        return res.status(200).json({
            success: true,
            data: { subtasks },
        });
    }
    catch (error) {
        console.error("Failed to get subtasks:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to get subtasks",
        });
    }
};
export const createSubtaskController = async (req, res) => {
    try {
        const taskId = getParam(req.params.taskId);
        if (!taskId) {
            return res.status(400).json({
                success: false,
                message: "Invalid task ID",
            });
        }
        const result = createSubtaskSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid subtask data",
                errors: result.error.flatten(),
            });
        }
        const subtask = await createSubtask(taskId, result.data);
        return res.status(201).json({
            success: true,
            data: { subtask },
        });
    }
    catch (error) {
        console.error("Failed to create subtask:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create subtask",
        });
    }
};
export const updateSubtaskController = async (req, res) => {
    try {
        const subtaskId = getParam(req.params.subtaskId);
        if (!subtaskId) {
            return res.status(400).json({
                success: false,
                message: "Invalid subtask ID",
            });
        }
        const result = updateSubtaskSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid subtask data",
                errors: result.error.flatten(),
            });
        }
        const subtask = await updateSubtask(subtaskId, result.data);
        return res.status(200).json({
            success: true,
            data: { subtask },
        });
    }
    catch (error) {
        console.error("Failed to update subtask:", error);
        if (error?.code === "P2025") {
            return res.status(404).json({
                success: false,
                message: "Subtask not found",
            });
        }
        return res.status(500).json({
            success: false,
            message: "Failed to update subtask",
        });
    }
};
export const deleteSubtaskController = async (req, res) => {
    try {
        const subtaskId = getParam(req.params.subtaskId);
        if (!subtaskId) {
            return res.status(400).json({
                success: false,
                message: "Invalid subtask ID",
            });
        }
        await deleteSubtask(subtaskId);
        return res.status(200).json({
            success: true,
            message: "Subtask deleted successfully",
        });
    }
    catch (error) {
        console.error("Failed to delete subtask:", error);
        if (error?.code === "P2025") {
            return res.status(404).json({
                success: false,
                message: "Subtask not found",
            });
        }
        return res.status(500).json({
            success: false,
            message: "Failed to delete subtask",
        });
    }
};
//# sourceMappingURL=subtask.controller.js.map