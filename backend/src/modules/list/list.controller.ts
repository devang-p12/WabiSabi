import type { Response } from "express";

import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";

import {
    createList,
    deleteList,
    getBoardLists,
    updateList,
} from "./list.service.js";

import {
    createListSchema,
    updateListSchema,
} from "./list.validation.js";

export const createListController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const { boardId } = req.params;

    if (typeof boardId !== "string") {
        return res.status(400).json({
            success: false,
            error: {
                message: "Invalid board ID.",
            },
        });
    }

    if (!req.userId) {
        return res.status(401).json({
            success: false,
            error: {
                message: "Unauthorized.",
            },
        });
    }

    const parsed = createListSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            success: false,
            error: {
                message: parsed.error.issues[0]?.message,
            },
        });
    }

    const result = await createList(
        boardId,
        req.userId,
        parsed.data
    );

    if ("error" in result) {
        const status =
            result.error === "Board not found."
                ? 404
                : 403;

        return res.status(status).json({
            success: false,
            error: {
                message: result.error,
            },
        });
    }

    return res.status(201).json({
        success: true,
        data: result,
    });
};

export const getBoardListsController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const { boardId } = req.params;

    if (typeof boardId !== "string") {
        return res.status(400).json({
            success: false,
            error: {
                message: "Invalid board ID.",
            },
        });
    }

    if (!req.userId) {
        return res.status(401).json({
            success: false,
            error: {
                message: "Unauthorized.",
            },
        });
    }

    const result = await getBoardLists(
        boardId,
        req.userId
    );

    if ("error" in result) {
        const status =
            result.error === "Board not found."
                ? 404
                : 403;

        return res.status(status).json({
            success: false,
            error: {
                message: result.error,
            },
        });
    }

    return res.json({
        success: true,
        data: result,
    });
};

export const updateListController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const { listId } = req.params;

    if (typeof listId !== "string") {
        return res.status(400).json({
            success: false,
            error: {
                message: "Invalid list ID.",
            },
        });
    }

    if (!req.userId) {
        return res.status(401).json({
            success: false,
            error: {
                message: "Unauthorized.",
            },
        });
    }

    const parsed = updateListSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            success: false,
            error: {
                message: parsed.error.issues[0]?.message,
            },
        });
    }

    const result = await updateList(
        listId,
        req.userId,
        parsed.data
    );

    if ("error" in result) {
        const status =
            result.error === "List not found."
                ? 404
                : 403;

        return res.status(status).json({
            success: false,
            error: {
                message: result.error,
            },
        });
    }

    return res.json({
        success: true,
        data: result,
    });
};

export const deleteListController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const { listId } = req.params;

    if (typeof listId !== "string") {
        return res.status(400).json({
            success: false,
            error: {
                message: "Invalid list ID.",
            },
        });
    }

    if (!req.userId) {
        return res.status(401).json({
            success: false,
            error: {
                message: "Unauthorized.",
            },
        });
    }

    const result = await deleteList(
        listId,
        req.userId
    );

    if ("error" in result) {
        const status =
            result.error === "List not found."
                ? 404
                : 403;

        return res.status(status).json({
            success: false,
            error: {
                message: result.error,
            },
        });
    }

    return res.json({
        success: true,
        data: result,
    });
};