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

interface AddWorkspaceMemberInput {
    email: string;
    role: "ADMIN" | "MEMBER";
}

export const addWorkspaceMember = async (
    workspaceId: string,
    data: AddWorkspaceMemberInput
) => {
    const user = await prisma.user.findUnique({
        where: {
            email: data.email,
        },
        select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
        },
    });

    if (!user) {
        return {
            error: "USER_NOT_FOUND",
        } as const;
    }

    const existingMember =
        await prisma.workspaceMember.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId: user.id,
                },
            },
        });

    if (existingMember) {
        return {
            error: "ALREADY_MEMBER",
        } as const;
    }

    const member =
        await prisma.workspaceMember.create({
            data: {
                workspaceId,
                userId: user.id,
                role: data.role,
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
        });

    return {
        member,
    } as const;
};