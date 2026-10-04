import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { prisma } from "../../config/prisma.js";

export const getBoardActivityLogsController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const boardId = req.params.boardId as string;
    const logs = await prisma.activityLog.findMany({
        where: { boardId },
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
        take: 50,
    });

    res.json({ success: true, data: logs });
};

export const getTaskActivityLogsController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const taskId = req.params.taskId as string;
    const logs = await prisma.activityLog.findMany({
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

    res.json({ success: true, data: logs });
};
