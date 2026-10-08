import { prisma } from "../../config/prisma.js";
export const getBoardActivityLogsController = async (req, res) => {
    const boardId = req.params.boardId;
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
export const getTaskActivityLogsController = async (req, res) => {
    const taskId = req.params.taskId;
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
//# sourceMappingURL=activity.controller.js.map