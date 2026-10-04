import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { prisma } from "../../config/prisma.js";

export const getTaskCommentsController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const taskId = req.params.taskId as string;
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

export const createCommentController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const taskId = req.params.taskId as string;
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

    res.status(201).json({ success: true, data: comment });
};

export const deleteCommentController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const commentId = req.params.commentId as string;
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

    res.json({ success: true, message: "Comment deleted" });
};
