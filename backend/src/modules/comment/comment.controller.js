import { prisma } from "../../config/prisma.js";
import { getIO } from "../../socket.js";
const emitBoardUpdateFromTask = async (taskId) => {
    try {
        const task = await prisma.task.findUnique({ where: { id: taskId }, include: { list: true } });
        if (task) {
            getIO().to(`board_${task.list.boardId}`).emit("board_updated");
        }
    }
    catch (e) {
        console.error(e);
    }
};
export const getTaskCommentsController = async (req, res) => {
    const taskId = req.params.taskId;
    const comments = await prisma.comment.findMany({
        where: { taskId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    res.json({ success: true, data: comments });
};
export const createCommentController = async (req, res) => {
    const taskId = req.params.taskId;
    const { text } = req.body;
    const userId = req.userId;
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    if (!text || typeof text !== "string" || !text.trim()) {
        res.status(400).json({ success: false, message: "Comment text is required." });
        return;
    }
    const comment = await prisma.comment.create({
        data: {
            text: text.trim(),
            taskId,
            userId,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                },
            },
        },
    });
    await emitBoardUpdateFromTask(taskId);
    res.status(201).json({ success: true, data: comment });
};
export const deleteCommentController = async (req, res) => {
    const commentId = req.params.commentId;
    const userId = req.userId;
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    const comment = await prisma.comment.findUnique({
        where: { id: commentId },
    });
    if (!comment) {
        res.status(404).json({ success: false, message: "Comment not found" });
        return;
    }
    if (comment.userId !== userId) {
        res.status(403).json({ success: false, message: "Forbidden" });
        return;
    }
    await prisma.comment.delete({
        where: { id: commentId },
    });
    await emitBoardUpdateFromTask(comment.taskId);
    res.json({ success: true, message: "Comment deleted" });
};
//# sourceMappingURL=comment.controller.js.map