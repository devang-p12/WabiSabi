import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { getTodayPlan } from "./planner.service.js";

export const getTodayPlanController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const workspaceId = typeof req.query.workspaceId === "string" && req.query.workspaceId.trim()
            ? req.query.workspaceId.trim()
            : undefined;

        const projectId = typeof req.query.projectId === "string" && req.query.projectId.trim()
            ? req.query.projectId.trim()
            : undefined;

        let availableMinutes: number | undefined = undefined;
        if (req.query.availableMinutes) {
            const parsed = parseInt(req.query.availableMinutes as string, 10);
            if (!Number.isNaN(parsed) && parsed > 0) {
                availableMinutes = parsed;
            }
        }

        const date = typeof req.query.date === "string" && req.query.date.trim()
            ? req.query.date.trim()
            : undefined;

        const plan = await getTodayPlan({
            userId: req.userId,
            workspaceId,
            projectId,
            availableMinutes,
            date,
        });

        return res.status(200).json({
            success: true,
            data: plan,
        });
    } catch (error: any) {
        console.error("Get today plan error:", error);
        return res.status(error.message?.includes("not a member") ? 403 : 500).json({
            success: false,
            message: error.message || "Failed to generate today plan.",
        });
    }
};
