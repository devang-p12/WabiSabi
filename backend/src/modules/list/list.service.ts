import { prisma } from "../../config/prisma.js";

import {
    getWorkspaceMembership,
    requireWorkspaceAdmin,
} from "../workspace/workspace.authorization.js";

export const createList = async (
    boardId: string,
    userId: string,
    data: {
        name: string;
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
            error: "You do not have permission to create lists in this board.",
        } as const;
    }

    const lastList = await prisma.boardList.findFirst({
        where: {
            boardId,
        },
        orderBy: {
            position: "desc",
        },
    });

    const position = lastList
        ? lastList.position + 1
        : 0;

    const list = await prisma.boardList.create({
        data: {
            name: data.name,
            boardId,
            position,
        },
    });

    return {
        list,
    } as const;
};

export const getBoardLists = async (
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
            error: "You are not a member of this workspace.",
        } as const;
    }

    const lists = await prisma.boardList.findMany({
        where: {
            boardId,
        },
        orderBy: {
            position: "asc",
        },
    });

    return {
        lists,
    } as const;
};

export const updateList = async (
    listId: string,
    userId: string,
    data: {
        name?: string;
    }
) => {
    const list = await prisma.boardList.findUnique({
        where: {
            id: listId,
        },
        include: {
            board: true,
        },
    });

    if (!list) {
        return {
            error: "List not found.",
        } as const;
    }

    const membership = await requireWorkspaceAdmin(
        list.board.workspaceId,
        userId
    );

    if (!membership) {
        return {
            error: "You do not have permission to update this list.",
        } as const;
    }

    const updatedList = await prisma.boardList.update({
        where: {
            id: listId,
        },
        data: {
            ...(data.name !== undefined && {
                name: data.name,
            }),
        },
    });

    return {
        list: updatedList,
    } as const;
};

export const deleteList = async (
    listId: string,
    userId: string
) => {
    const list = await prisma.boardList.findUnique({
        where: {
            id: listId,
        },
        include: {
            board: true,
        },
    });

    if (!list) {
        return {
            error: "List not found.",
        } as const;
    }

    const membership = await requireWorkspaceAdmin(
        list.board.workspaceId,
        userId
    );

    if (!membership) {
        return {
            error: "You do not have permission to delete this list.",
        } as const;
    }

    await prisma.boardList.delete({
        where: {
            id: listId,
        },
    });

    return {
        success: true,
    } as const;
};