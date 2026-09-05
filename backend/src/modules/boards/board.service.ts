import { prisma } from "../../config/prisma.js";
import { getWorkspaceMembership, requireWorkspaceAdmin } from "../workspace/workspace.authorization.js";

export const createBoard = async (
    workspaceId: string,
    userId: string,
    data: {
        name: string;
        description?: string | undefined;
    }
) => {
    const membership = await requireWorkspaceAdmin(
        workspaceId,
        userId
    );

    if (!membership) {
        return {
            error: "You do not have permission to create boards in this workspace.",
        } as const;
    }

    const workspace = await prisma.workspace.findUnique({
        where: {
            id: workspaceId,
        },
    });

    if (!workspace) {
        return {
            error: "Workspace not found.",
        } as const;
    }

    const board = await prisma.board.create({
        data: {
            name: data.name,
            description: data.description ?? null,
            workspaceId,
        },
    });

    return {
        board,
    } as const;
};

export const getWorkspaceBoards = async (
    workspaceId: string,
    userId: string
) => {
    const membership = await getWorkspaceMembership(
        workspaceId,
        userId
    );

    if (!membership) {
        return {
            error: "You are not a member of this workspace.",
        } as const;
    }

    const workspace = await prisma.workspace.findUnique({
        where: {
            id: workspaceId,
        },
    });

    if (!workspace) {
        return {
            error: "Workspace not found.",
        } as const;
    }

    const boards = await prisma.board.findMany({
        where: {
            workspaceId,
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return {
        boards,
    } as const;
};

export const getBoard = async (
    boardId: string,
    userId: string
) => {
    const board = await prisma.board.findUnique({
        where: {
            id: boardId,
        },
    });

    if (!board) {
        return {
            error: "Board not found.",
        } as const;
    }

    const membership = await getWorkspaceMembership(
        board.workspaceId,
        userId
    );

    if (!membership) {
        return {
            error: "You do not have access to this board.",
        } as const;
    }

    return {
        board,
    } as const;
};

export const updateBoard = async (
    boardId: string,
    userId: string,
    data: {
        name?: string | undefined;
        description?: string | null | undefined;
    }
) => {
    const board = await prisma.board.findUnique({
        where: {
            id: boardId,
        },
    });

    if (!board) {
        return {
            error: "Board not found.",
        } as const;
    }

    const membership = await requireWorkspaceAdmin(
        board.workspaceId,
        userId
    );

    if (!membership) {
        return {
            error: "You do not have permission to update this board.",
        } as const;
    }

    const updatedBoard = await prisma.board.update({
        where: {
            id: boardId,
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

    return {
        board: updatedBoard,
    } as const;
};

export const deleteBoard = async (
    boardId: string,
    userId: string
) => {
    const board = await prisma.board.findUnique({
        where: {
            id: boardId,
        },
    });

    if (!board) {
        return {
            error: "Board not found.",
        } as const;
    }

    const membership = await requireWorkspaceAdmin(
        board.workspaceId,
        userId
    );

    if (!membership) {
        return {
            error: "You do not have permission to delete this board.",
        } as const;
    }

    await prisma.board.delete({
        where: {
            id: boardId,
        },
    });

    return {
        success: true,
    } as const;
};