import { prisma } from "../../config/prisma.js";
import { getIO } from "../../socket.js";

export const getTaskAttachments = async (taskId: string) => {
    return await prisma.attachment.findMany({
        where: { taskId },
        orderBy: { createdAt: "desc" },
    });
};

export const createAttachment = async (
    taskId: string,
    data: { name: string; url: string; size: number; type: string }
) => {
    const attachment = await prisma.attachment.create({
        data: {
            taskId,
            name: data.name,
            url: data.url,
            size: data.size,
            type: data.type,
        },
    });

    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { list: true },
    });

    // Auto-set cover if task has none and this is an image
    if (task && !task.coverUrl && data.type.startsWith("image/")) {
        await prisma.task.update({
            where: { id: taskId },
            data: { coverUrl: data.url },
        });
    }

    if (task) {
        try {
            getIO().to(`board_${task.list.boardId}`).emit("board_updated");
        } catch (e) {
            console.error("Socket error on createAttachment:", e);
        }
    }

    return attachment;
};

export const deleteAttachment = async (attachmentId: string) => {
    const attachment = await prisma.attachment.findUnique({
        where: { id: attachmentId },
        include: { task: { include: { list: true } } },
    });

    if (!attachment) return false;

    await prisma.attachment.delete({
        where: { id: attachmentId },
    });

    // If this was the current coverUrl, fallback to another image or null
    if (attachment.task.coverUrl === attachment.url) {
        const nextImage = await prisma.attachment.findFirst({
            where: { taskId: attachment.taskId, type: { startsWith: "image/" } },
            orderBy: { createdAt: "desc" },
        });

        await prisma.task.update({
            where: { id: attachment.taskId },
            data: { coverUrl: nextImage ? nextImage.url : null },
        });
    }

    try {
        getIO().to(`board_${attachment.task.list.boardId}`).emit("board_updated");
    } catch (e) {
        console.error("Socket error on deleteAttachment:", e);
    }

    return true;
};

export const setTaskCover = async (taskId: string, coverUrl: string | null) => {
    const task = await prisma.task.update({
        where: { id: taskId },
        data: { coverUrl },
        include: { list: true },
    });

    try {
        getIO().to(`board_${task.list.boardId}`).emit("board_updated");
    } catch (e) {
        console.error("Socket error on setTaskCover:", e);
    }

    return task;
};
