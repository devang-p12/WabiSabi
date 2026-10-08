import { prisma } from "../../config/prisma.js";
export const getBoardLabels = async (boardId) => {
    return prisma.label.findMany({
        where: {
            boardId,
        },
        orderBy: {
            name: "asc",
        },
    });
};
import { getIO } from "../../socket.js";
const emitBoardUpdate = async (boardId) => {
    try {
        getIO().to(`board_${boardId}`).emit("board_updated");
    }
    catch (e) {
        console.error(e);
    }
};
const emitBoardUpdateFromLabel = async (labelId) => {
    try {
        const label = await prisma.label.findUnique({ where: { id: labelId } });
        if (label)
            await emitBoardUpdate(label.boardId);
    }
    catch (e) {
        console.error(e);
    }
};
const emitBoardUpdateFromTask = async (taskId) => {
    try {
        const task = await prisma.task.findUnique({ where: { id: taskId }, include: { list: true } });
        if (task)
            await emitBoardUpdate(task.list.boardId);
    }
    catch (e) {
        console.error(e);
    }
};
export const createLabel = async (boardId, data) => {
    const label = await prisma.label.create({
        data: {
            name: data.name,
            color: data.color,
            boardId,
        },
    });
    await emitBoardUpdate(boardId);
    return label;
};
export const updateLabel = async (labelId, data) => {
    const label = await prisma.label.update({
        where: {
            id: labelId,
        },
        data: {
            ...(data.name !== undefined && {
                name: data.name,
            }),
            ...(data.color !== undefined && {
                color: data.color,
            }),
        },
    });
    await emitBoardUpdateFromLabel(labelId);
    return label;
};
export const deleteLabel = async (labelId) => {
    const label = await prisma.label.findUnique({ where: { id: labelId } });
    const boardId = label?.boardId;
    const deleted = await prisma.label.delete({
        where: {
            id: labelId,
        },
    });
    if (boardId)
        await emitBoardUpdate(boardId);
    return deleted;
};
export const addLabelToTask = async (taskId, labelId) => {
    const taskLabel = await prisma.taskLabel.create({
        data: {
            taskId,
            labelId,
        },
        include: {
            label: true,
        },
    });
    await emitBoardUpdateFromTask(taskId);
    return taskLabel;
};
export const removeLabelFromTask = async (taskId, labelId) => {
    const deleted = await prisma.taskLabel.delete({
        where: {
            taskId_labelId: {
                taskId,
                labelId,
            },
        },
    });
    await emitBoardUpdateFromTask(taskId);
    return deleted;
};
//# sourceMappingURL=label.service.js.map