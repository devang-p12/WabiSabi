import { prisma } from "../../config/prisma.js";

export const getTaskSubtasks = async (taskId: string) => {
    return await prisma.subtask.findMany({
        where: { taskId },
        orderBy: { createdAt: "asc" },
    });
};

import { getIO } from "../../socket.js";

const emitBoardUpdateFromTask = async (taskId: string) => {
    try {
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: { list: true }
        });
        if (task) {
            getIO().to(`board_${task.list.boardId}`).emit("board_updated");
        }
    } catch (e) {
        console.error(e);
    }
};

export const createSubtask = async (
    taskId: string,
    data: { title: string }
) => {
    const subtask = await prisma.subtask.create({
        data: {
            title: data.title,
            taskId,
        },
    });
    await emitBoardUpdateFromTask(taskId);
    return subtask;
};

export const updateSubtask = async (
    subtaskId: string,
    data: { title?: string; completed?: boolean }
) => {
    const subtask = await prisma.subtask.update({
        where: { id: subtaskId },
        data,
    });
    await emitBoardUpdateFromTask(subtask.taskId);
    return subtask;
};

export const deleteSubtask = async (subtaskId: string) => {
    const subtask = await prisma.subtask.delete({
        where: { id: subtaskId },
    });
    await emitBoardUpdateFromTask(subtask.taskId);
    return subtask;
};
