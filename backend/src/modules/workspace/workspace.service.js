import { prisma } from "../../config/prisma.js";
export const createWorkspace = async (userId, data) => {
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
export const getUserWorkspaces = async (userId) => {
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
export const getWorkspaceById = async (workspaceId, userId) => {
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
export const updateWorkspace = async (workspaceId, data) => {
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
export const deleteWorkspace = async (workspaceId) => {
    return prisma.workspace.delete({
        where: {
            id: workspaceId,
        },
    });
};
export const getWorkspaceMembers = async (workspaceId) => {
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
export const addWorkspaceMember = async (workspaceId, data) => {
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
        };
    }
    const existingMember = await prisma.workspaceMember.findUnique({
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
        };
    }
    const member = await prisma.workspaceMember.create({
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
    };
};
export const updateWorkspaceMember = async (workspaceId, userId, data) => {
    const member = await prisma.workspaceMember.findUnique({
        where: {
            workspaceId_userId: {
                workspaceId,
                userId,
            },
        },
    });
    if (!member) {
        return {
            error: "MEMBER_NOT_FOUND",
        };
    }
    if (member.role === "OWNER") {
        return {
            error: "OWNER_CANNOT_BE_MODIFIED",
        };
    }
    const updatedMember = await prisma.workspaceMember.update({
        where: {
            workspaceId_userId: {
                workspaceId,
                userId,
            },
        },
        data: {
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
        member: updatedMember,
    };
};
export const removeWorkspaceMember = async (workspaceId, userId) => {
    const member = await prisma.workspaceMember.findUnique({
        where: {
            workspaceId_userId: {
                workspaceId,
                userId,
            },
        },
    });
    if (!member) {
        return {
            error: "MEMBER_NOT_FOUND",
        };
    }
    if (member.role === "OWNER") {
        return {
            error: "OWNER_CANNOT_BE_REMOVED",
        };
    }
    await prisma.workspaceMember.delete({
        where: {
            workspaceId_userId: {
                workspaceId,
                userId,
            },
        },
    });
    return {
        success: true,
    };
};
//# sourceMappingURL=workspace.service.js.map