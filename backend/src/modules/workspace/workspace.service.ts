import { prisma } from "../../config/prisma.js";

interface CreateWorkspaceInput {
    name: string;
    description?: string | undefined;
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