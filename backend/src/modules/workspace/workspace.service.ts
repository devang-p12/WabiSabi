import { prisma } from "../../config/prisma.js";

interface CreateWorkspaceInput {
    name: string;
    description?: string | undefined;
}

interface UpdateWorkspaceInput {
    name?: string | undefined;
    description?: string | null | undefined;
}


export const createWorkspace = async (
    userId: string,
    data: CreateWorkspaceInput
) => {
    return prisma.$transaction(async (tx) => {
        const workspace = await tx.workspace.create({
            data: {
                name: data.name,
                description: data.description ?? null,
            },
        });

        await tx.workspaceMember.create({
            data: {
                workspaceId: workspace.id,
                userId,
                role: "OWNER",
            },
        });

        return workspace;
    });
};

export const getUserWorkspaces = async (
    userId: string
) => {
    return prisma.workspace.findMany({
        where: {
            members: {
                some: {
                    userId,
                },
            },
        },
        include: {
            members: {
                select: {
                    userId: true,
                    role: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
};

export const getWorkspaceById = async (
    workspaceId: string,
    userId: string
) => {
    return prisma.workspace.findFirst({
        where: {
            id: workspaceId,
            members: {
                some: {
                    userId,
                },
            },
        },
        include: {
            members: {
                select: {
                    userId: true,
                    role: true,
                },
            },
        },
    });
};

export const updateWorkspace = async (
    workspaceId: string,
    data: UpdateWorkspaceInput
) => {
    return prisma.workspace.update({
        where: {
            id: workspaceId,
        },
        data: {
            ...(data.name !== undefined && {
                name: data.name,
            }),

            ...(data.description !== undefined && {
                description: data.description,
            }),
        },
    });
};

export const deleteWorkspace = async (
    workspaceId: string
) => {
    return prisma.workspace.delete({
        where: {
            id: workspaceId,
        },
    });
};

export const getWorkspaceMembers = async (
    workspaceId: string,
) => {
    return prisma.workspaceMember.findMany({
        where: {
            workspaceId,
        },
        select: {
            userId: true,
            role: true,
            createdAt: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                },
            },
        },
        orderBy: {
            createdAt: "asc",
        },
    });
};