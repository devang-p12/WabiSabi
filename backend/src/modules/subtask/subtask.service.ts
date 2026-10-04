import { prisma } from "../../config/prisma.js";

export const getTaskSubtasks = async (taskId: string) => {
    return await prisma.subtask.findMany({
        where: { taskId },
        orderBy: { createdAt: "asc" },
    });
};

export const createSubtask = async (
    taskId: string,
    data: { title: string }
) => {
    return await prisma.subtask.create({
        data: {
            title: data.title,
            taskId,
        },
    });
};

export const updateSubtask = async (
    subtaskId: string,
    data: { title?: string; completed?: boolean }
) => {
    return await prisma.subtask.update({
        where: { id: subtaskId },
        data,
    });
};

export const deleteSubtask = async (subtaskId: string) => {
    return await prisma.subtask.delete({
        where: { id: subtaskId },
    });
};
