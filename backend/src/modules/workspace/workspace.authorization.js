import { prisma } from "../../config/prisma.js";
export const getWorkspaceMembership = async (workspaceId, userId) => {
    return prisma.workspaceMember.findUnique({
        where: {
            workspaceId_userId: {
                workspaceId,
                userId,
            },
        },
    });
};
export const requireWorkspaceAdmin = async (workspaceId, userId) => {
    const membership = await getWorkspaceMembership(workspaceId, userId);
    if (!membership) {
        return null;
    }
    if (membership.role !== "OWNER" &&
        membership.role !== "ADMIN") {
        return null;
    }
    return membership;
};
export const requireWorkspaceOwner = async (workspaceId, userId) => {
    const membership = await getWorkspaceMembership(workspaceId, userId);
    if (!membership) {
        return null;
    }
    if (membership.role !== "OWNER") {
        return null;
    }
    return membership;
};
export const canRemoveWorkspaceMember = async (workspaceId, currentUserId, targetUserId) => {
    const currentMembership = await getWorkspaceMembership(workspaceId, currentUserId);
    if (!currentMembership) {
        return false;
    }
    const targetMembership = await getWorkspaceMembership(workspaceId, targetUserId);
    if (!targetMembership) {
        return false;
    }
    if (targetMembership.role === "OWNER") {
        return false;
    }
    if (currentMembership.role === "OWNER") {
        return true;
    }
    if (currentMembership.role === "ADMIN" &&
        targetMembership.role === "MEMBER") {
        return true;
    }
    return false;
};
//# sourceMappingURL=workspace.authorization.js.map