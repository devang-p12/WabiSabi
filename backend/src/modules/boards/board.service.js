import { prisma } from "../../config/prisma.js";
import { getWorkspaceMembership, requireWorkspaceAdmin } from "../workspace/workspace.authorization.js";
export const createBoard = async (workspaceId, userId, data) => {
    const membership = await requireWorkspaceAdmin(workspaceId, userId);
    if (!membership) {
        return {
            error: "You do not have permission to create boards in this workspace.",
        };
    }
    const workspace = await prisma.workspace.findUnique({
        where: {
            id: workspaceId,
        },
    });
    if (!workspace) {
        return {
            error: "Workspace not found.",
        };
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
    };
};
export const getWorkspaceBoards = async (workspaceId, userId) => {
    const membership = await getWorkspaceMembership(workspaceId, userId);
    if (!membership) {
        return {
            error: "You are not a member of this workspace.",
        };
    }
    const workspace = await prisma.workspace.findUnique({
        where: {
            id: workspaceId,
        },
    });
    if (!workspace) {
        return {
            error: "Workspace not found.",
        };
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
    };
};
export const getBoard = async (boardId, userId) => {
    const board = await prisma.board.findUnique({
        where: {
            id: boardId,
        },
    });
    if (!board) {
        return {
            error: "Board not found.",
        };
    }
    const membership = await getWorkspaceMembership(board.workspaceId, userId);
    if (!membership) {
        return {
            error: "You do not have access to this board.",
        };
    }
    return {
        board,
    };
};
export const updateBoard = async (boardId, userId, data) => {
    const board = await prisma.board.findUnique({
        where: {
            id: boardId,
        },
    });
    if (!board) {
        return {
            error: "Board not found.",
        };
    }
    const membership = await requireWorkspaceAdmin(board.workspaceId, userId);
    if (!membership) {
        return {
            error: "You do not have permission to update this board.",
        };
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
    };
};
export const deleteBoard = async (boardId, userId) => {
    const board = await prisma.board.findUnique({
        where: {
            id: boardId,
        },
    });
    if (!board) {
        return {
            error: "Board not found.",
        };
    }
    const membership = await requireWorkspaceAdmin(board.workspaceId, userId);
    if (!membership) {
        return {
            error: "You do not have permission to delete this board.",
        };
    }
    await prisma.board.delete({
        where: {
            id: boardId,
        },
    });
    return {
        success: true,
    };
};
//# sourceMappingURL=board.service.js.map