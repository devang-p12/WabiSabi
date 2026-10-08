import { prisma } from "../../config/prisma.js";
import { getWorkspaceMembership, requireWorkspaceAdmin, } from "../workspace/workspace.authorization.js";
import { getIO } from "../../socket.js";
export const createList = async (boardId, userId, data) => {
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
            error: "You do not have permission to create lists in this board.",
        };
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
    try {
        getIO().to(`board_${boardId}`).emit("board_updated");
    }
    catch (e) {
        console.error("Socket error on createList:", e);
    }
    return {
        list,
    };
};
export const getBoardLists = async (boardId, userId) => {
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
            error: "You are not a member of this workspace.",
        };
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
    };
};
export const updateList = async (listId, userId, data) => {
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
        };
    }
    const membership = await requireWorkspaceAdmin(list.board.workspaceId, userId);
    if (!membership) {
        return {
            error: "You do not have permission to update this list.",
        };
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
    try {
        getIO().to(`board_${list.boardId}`).emit("board_updated");
    }
    catch (e) {
        console.error("Socket error on updateList:", e);
    }
    return {
        list: updatedList,
    };
};
export const deleteList = async (listId, userId) => {
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
        };
    }
    const membership = await requireWorkspaceAdmin(list.board.workspaceId, userId);
    if (!membership) {
        return {
            error: "You do not have permission to delete this list.",
        };
    }
    await prisma.boardList.delete({
        where: {
            id: listId,
        },
    });
    try {
        getIO().to(`board_${list.boardId}`).emit("board_updated");
    }
    catch (e) {
        console.error("Socket error on deleteList:", e);
    }
    return {
        success: true,
    };
};
//# sourceMappingURL=list.service.js.map