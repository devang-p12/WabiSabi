import { prisma } from "../../config/prisma.js";

export const searchWorkspaceEntities = async (userId: string, query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
        return {
            tasks: [],
            boards: [],
            workspaces: [],
        };
    }

    const [workspaces, boards, tasks] = await Promise.all([
        prisma.workspace.findMany({
            where: {
                members: { some: { userId } },
                OR: [
                    { name: { contains: trimmed, mode: "insensitive" } },
                    { description: { contains: trimmed, mode: "insensitive" } },
                ],
            },
            select: {
                id: true,
                name: true,
                description: true,
            },
            take: 5,
        }),

        prisma.board.findMany({
            where: {
                workspace: { members: { some: { userId } } },
                OR: [
                    { name: { contains: trimmed, mode: "insensitive" } },
                    { description: { contains: trimmed, mode: "insensitive" } },
                ],
            },
            select: {
                id: true,
                name: true,
                description: true,
                workspaceId: true,
                workspace: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            take: 8,
        }),

        prisma.task.findMany({
            where: {
                list: {
                    board: {
                        workspace: { members: { some: { userId } } },
                    },
                },
                OR: [
                    { title: { contains: trimmed, mode: "insensitive" } },
                    { description: { contains: trimmed, mode: "insensitive" } },
                ],
            },
            select: {
                id: true,
                title: true,
                description: true,
                priority: true,
                completed: true,
                dueDate: true,
                list: {
                    select: {
                        id: true,
                        name: true,
                        board: {
                            select: {
                                id: true,
                                name: true,
                                workspaceId: true,
                            },
                        },
                    },
                },
                assignee: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
            },
            take: 12,
        }),
    ]);

    return {
        workspaces,
        boards,
        tasks,
    };
};
