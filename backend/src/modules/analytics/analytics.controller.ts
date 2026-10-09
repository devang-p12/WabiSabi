import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { getWorkspaceAnalyticsService } from "./analytics.service.js";
import { prisma } from "../../config/prisma.js";

export const getWorkspaceAnalyticsController = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: "Authentication required." });
            return;
        }

        const rawWorkspaceId = req.params.workspaceId;
        const workspaceId = Array.isArray(rawWorkspaceId) ? rawWorkspaceId[0] : rawWorkspaceId;
        if (!workspaceId) {
            res.status(400).json({ success: false, message: "Workspace ID is required." });
            return;
        }

        const boardId = typeof req.query.boardId === "string" && req.query.boardId.trim().length > 0
            ? req.query.boardId.trim()
            : undefined;

        const timeframe = (req.query.timeframe as "7d" | "14d" | "30d") || "7d";

        const analytics = await getWorkspaceAnalyticsService(workspaceId, userId, {
            boardId,
            timeframe,
        });

        res.json({
            success: true,
            data: analytics,
        });
    } catch (error: any) {
        if (error.message?.includes("Forbidden")) {
            res.status(403).json({ success: false, message: error.message });
            return;
        }
        next(error);
    }
};

export const getBoardAnalyticsController = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: "Authentication required." });
            return;
        }

        const rawBoardId = req.params.boardId;
        const boardId = Array.isArray(rawBoardId) ? rawBoardId[0] : rawBoardId;
        if (!boardId) {
            res.status(400).json({ success: false, message: "Board ID is required." });
            return;
        }

        const board = await prisma.board.findUnique({
            where: { id: boardId },
            select: { id: true, workspaceId: true },
        });

        if (!board) {
            res.status(404).json({ success: false, message: "Board not found." });
            return;
        }

        const timeframe = (req.query.timeframe as "7d" | "14d" | "30d") || "7d";

        const analytics = await getWorkspaceAnalyticsService(board.workspaceId, userId, {
            boardId: board.id,
            timeframe,
        });

        res.json({
            success: true,
            data: analytics,
        });
    } catch (error: any) {
        if (error.message?.includes("Forbidden")) {
            res.status(403).json({ success: false, message: error.message });
            return;
        }
        next(error);
    }
};
