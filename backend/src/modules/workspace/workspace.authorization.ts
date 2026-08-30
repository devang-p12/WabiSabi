import { prisma } from "../../config/prisma.js";

import type { WorkspaceRole } from "../../generated/prisma/client.js";

export const getWorkspaceMembership = async (
    workspaceId: string,
    userId: string
) => {
    return prisma.workspaceMember.findUnique({
        where: {
            workspaceId_userId: {
                workspaceId,
                userId,
            },
        },
    });
};

export const requireWorkspaceAdmin = async (
    workspaceId: string,
    userId: string
) => {
    const membership =
        await getWorkspaceMembership(
            workspaceId,
            userId
        );

    if (!membership) {
        return null;
    }

    if (
        membership.role !== "OWNER" &&
        membership.role !== "ADMIN"
    ) {
        return null;
    }

    return membership;
};

export const requireWorkspaceOwner = async (
    workspaceId: string,
    userId: string
) => {
    const membership =
        await getWorkspaceMembership(
            workspaceId,
            userId
        );

    if (!membership) {
        return null;
    }

    if (membership.role !== "OWNER") {
        return null;
    }

    return membership;
};