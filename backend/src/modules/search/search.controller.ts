import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { searchWorkspaceEntities } from "./search.service.js";

export const globalSearchController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const userId = req.userId;
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }

    const query = (req.query.q as string) || "";
    const results = await searchWorkspaceEntities(userId, query);

    res.json({
        success: true,
        data: results,
    });
};
