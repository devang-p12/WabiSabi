import type { Response } from "express";

import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";

import {
    createBoard,
    getWorkspaceBoards,
    getBoard,
    updateBoard,
    deleteBoard,
} from "./board.service.js";

import {
    createBoardSchema,
    updateBoardSchema,
} from "./board.validation.js";

export const createBoardController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        const userId = req.userId;
        const workspaceId = req.params.workspaceId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: {
                    code: "UNAUTHORIZED",
                    message: "Unauthorized",
                },
            });
        }

        if (typeof workspaceId !== "string") {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_WORKSPACE",
                    message: "Invalid workspace ID.",
                },
            });
        }

        const result = createBoardSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: result.error.issues[0]?.message,
                },
            });
        }

        const board = await createBoard(
            workspaceId,
            userId,
            result.data
        );

        if ("error" in board) {
            return res.status(403).json({
                success: false,
                error: {
                    code: "FORBIDDEN",
                    message: board.error,
                },
            });
        }

        return res.status(201).json({
            success: true,
            data: {
                board: board.board,
            },
        });
    } catch (error) {
        console.error("Create board error:", error);

        return res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Unable to create board.",
            },
        });
    }
};

export const getWorkspaceBoardsController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        const userId = req.userId;
        const workspaceId = req.params.workspaceId;

        if (typeof workspaceId !== "string") {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_WORKSPACE",
                    message: "Invalid workspace ID.",
                },
            });
        }

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: {
                    code: "UNAUTHORIZED",
                    message: "Unauthorized",
                },
            });
        }

        if (!workspaceId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_WORKSPACE",
                    message: "Workspace ID is required.",
                },
            });
        }

        const result = await getWorkspaceBoards(
            workspaceId,
            userId
        );

        if ("error" in result) {
            return res.status(403).json({
                success: false,
                error: {
                    code: "FORBIDDEN",
                    message: result.error,
                },
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                boards: result.boards,
            },
        });
    } catch (error) {
        console.error("Get workspace boards error:", error);

        return res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Unable to get boards.",
            },
        });
    }
};

export const getBoardController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        const userId = req.userId;
        const boardId = req.params.boardId;

        if (typeof boardId !== "string") {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_BOARD",
                    message: "Invalid board ID.",
                },
            });
        }

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: {
                    code: "UNAUTHORIZED",
                    message: "Unauthorized",
                },
            });
        }

        if (!boardId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_BOARD",
                    message: "Board ID is required.",
                },
            });
        }

        const result = await getBoard(
            boardId,
            userId
        );

        if ("error" in result) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "BOARD_NOT_FOUND",
                    message: result.error,
                },
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                board: result.board,
            },
        });
    } catch (error) {
        console.error("Get board error:", error);

        return res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Unable to get board.",
            },
        });
    }
};

export const updateBoardController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        const userId = req.userId;
        const boardId = req.params.boardId;

        if (typeof boardId !== "string") {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_BOARD",
                    message: "Invalid board ID.",
                },
            });
        }

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: {
                    code: "UNAUTHORIZED",
                    message: "Unauthorized",
                },
            });
        }

        if (!boardId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_BOARD",
                    message: "Board ID is required.",
                },
            });
        }

        const result = updateBoardSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: result.error.issues[0]?.message,
                },
            });
        }

        const board = await updateBoard(
            boardId,
            userId,
            result.data
        );

        if ("error" in board) {
            return res.status(403).json({
                success: false,
                error: {
                    code: "FORBIDDEN",
                    message: board.error,
                },
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                board: board.board,
            },
        });
    } catch (error) {
        console.error("Update board error:", error);

        return res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Unable to update board.",
            },
        });
    }
};

export const deleteBoardController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        const userId = req.userId;
        const boardId = req.params.boardId;

        if (typeof boardId !== "string") {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_BOARD",
                    message: "Invalid board ID.",
                },
            });
        }

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: {
                    code: "UNAUTHORIZED",
                    message: "Unauthorized",
                },
            });
        }

        if (!boardId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_BOARD",
                    message: "Board ID is required.",
                },
            });
        }

        const result = await deleteBoard(
            boardId,
            userId
        );

        if ("error" in result) {
            return res.status(403).json({
                success: false,
                error: {
                    code: "FORBIDDEN",
                    message: result.error,
                },
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                message: "Board deleted successfully.",
            },
        });
    } catch (error) {
        console.error("Delete board error:", error);

        return res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Unable to delete board.",
            },
        });
    }
};