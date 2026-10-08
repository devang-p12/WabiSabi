import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { prisma } from "../../config/prisma.js";

import { getIO } from "../../socket.js";
import { createNotification } from "../notification/notification.service.js";

const emitBoardUpdateFromTask = async (taskId: string) => {
    try {
        const task = await prisma.task.findUnique({ where: { id: taskId }, include: { list: true }});
        if (task) {
            getIO().to(`board_${task.list.boardId}`).emit("board_updated");
        }
    } catch (e) {
        console.error(e);
    }
};

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

    await emitBoardUpdateFromTask(taskId);

    // Notifications for assignee and @mentions
    try {
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: {
                list: {
                    include: {
                        board: {
                            include: {
                                workspace: {
                                    include: {
                                        members: {
                                            include: {
                                                user: {
                                                    select: {
                                                        id: true,
                                                        name: true,
                                                        email: true,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (task) {
            const authorName = comment.user.name || "Someone";
            const previewText = text.trim().length > 60
                ? text.trim().slice(0, 60) + "..."
                : text.trim();

            // 1. Notify Assignee if not the author
            if (task.assigneeId && task.assigneeId !== userId) {
                await createNotification({
                    userId: task.assigneeId,
                    actorId: userId,
                    type: "TASK_COMMENT",
                    title: "New comment on your task",
                    message: `${authorName} commented on "${task.title}": "${previewText}"`,
                    taskId: task.id,
                    boardId: task.list.boardId,
                    workspaceId: task.list.board.workspaceId,
                });
            }

            // 2. Check for @mentions of other workspace members
            const lowerText = text.toLowerCase();
            const members = task.list.board.workspace?.members ?? [];
            for (const member of members) {
                if (member.userId === userId || member.userId === task.assigneeId) {
                    continue; // Skip author and already-notified assignee
                }

                const memberName = member.user.name.toLowerCase();
                const memberEmailPrefix = member.user.email.split("@")[0]?.toLowerCase() ?? "";

                // Check if @firstname or @fullname or @emailPrefix appears in text
                const isMentioned =
                    (memberName && lowerText.includes(`@${memberName}`)) ||
                    (memberEmailPrefix && lowerText.includes(`@${memberEmailPrefix}`)) ||
                    (memberName.split(" ")[0] && lowerText.includes(`@${memberName.split(" ")[0]}`));

                if (isMentioned) {
                    await createNotification({
                        userId: member.userId,
                        actorId: userId,
                        type: "TASK_MENTION",
                        title: "You were mentioned in a comment",
                        message: `${authorName} mentioned you on "${task.title}": "${previewText}"`,
                        taskId: task.id,
                        boardId: task.list.boardId,
                        workspaceId: task.list.board.workspaceId,
                    });
                }
            }
        }
    } catch (notifErr) {
        console.error("Failed to process comment notifications:", notifErr);
    }

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

    await emitBoardUpdateFromTask(comment.taskId);

    res.json({ success: true, message: "Comment deleted" });
};
