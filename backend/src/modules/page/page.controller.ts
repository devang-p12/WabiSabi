import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import {
    createPage,
    getWorkspacePagesTree,
    getPage,
    updatePage,
    deletePage,
    createBlock,
    updateBlock,
    deleteBlock,
    batchSaveBlocks,
} from "./page.service.js";
import {
    createPageSchema,
    updatePageSchema,
    createBlockSchema,
    updateBlockSchema,
    batchSaveBlocksSchema,
} from "./page.validation.js";

// ==========================================
// Page Controllers
// ==========================================

export const createPageController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Authentication required." });
        }

        const workspaceId = Array.isArray(req.params.workspaceId)
            ? req.params.workspaceId[0]
            : req.params.workspaceId;

        if (!workspaceId) {
            return res.status(400).json({ success: false, message: "Workspace ID is required." });
        }

        const parsed = createPageSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: parsed.error.issues[0]?.message || "Validation failed.",
            });
        }

        const result = await createPage(workspaceId, req.userId, parsed.data);
        if ("error" in result) {
            return res.status(403).json({ success: false, message: result.error });
        }

        return res.status(201).json({ success: true, data: result.page });
    } catch (error) {
        console.error("Create page error:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

export const getWorkspacePagesController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Authentication required." });
        }

        const workspaceId = Array.isArray(req.params.workspaceId)
            ? req.params.workspaceId[0]
            : req.params.workspaceId;

        if (!workspaceId) {
            return res.status(400).json({ success: false, message: "Workspace ID is required." });
        }

        const result = await getWorkspacePagesTree(workspaceId, req.userId);
        if ("error" in result) {
            return res.status(403).json({ success: false, message: result.error });
        }

        return res.status(200).json({ success: true, data: result.pages });
    } catch (error) {
        console.error("Get workspace pages error:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

export const getPageController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Authentication required." });
        }

        const pageId = Array.isArray(req.params.pageId)
            ? req.params.pageId[0]
            : req.params.pageId;

        if (!pageId) {
            return res.status(400).json({ success: false, message: "Page ID is required." });
        }

        const result = await getPage(pageId, req.userId);
        if ("error" in result) {
            return res.status(404).json({ success: false, message: result.error });
        }

        return res.status(200).json({ success: true, data: result.page });
    } catch (error) {
        console.error("Get page error:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

export const updatePageController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Authentication required." });
        }

        const pageId = Array.isArray(req.params.pageId)
            ? req.params.pageId[0]
            : req.params.pageId;

        if (!pageId) {
            return res.status(400).json({ success: false, message: "Page ID is required." });
        }

        const parsed = updatePageSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: parsed.error.issues[0]?.message || "Validation failed.",
            });
        }

        const result = await updatePage(pageId, req.userId, parsed.data);
        if ("error" in result) {
            return res.status(403).json({ success: false, message: result.error });
        }

        return res.status(200).json({ success: true, data: result.page });
    } catch (error) {
        console.error("Update page error:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

export const deletePageController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Authentication required." });
        }

        const pageId = Array.isArray(req.params.pageId)
            ? req.params.pageId[0]
            : req.params.pageId;

        if (!pageId) {
            return res.status(400).json({ success: false, message: "Page ID is required." });
        }

        const result = await deletePage(pageId, req.userId);
        if ("error" in result) {
            return res.status(403).json({ success: false, message: result.error });
        }

        return res.status(200).json({ success: true, message: "Page deleted successfully." });
    } catch (error) {
        console.error("Delete page error:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

// ==========================================
// Block Controllers
// ==========================================

export const createBlockController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Authentication required." });
        }

        const pageId = Array.isArray(req.params.pageId)
            ? req.params.pageId[0]
            : req.params.pageId;

        if (!pageId) {
            return res.status(400).json({ success: false, message: "Page ID is required." });
        }

        const parsed = createBlockSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: parsed.error.issues[0]?.message || "Validation failed.",
            });
        }

        const result = await createBlock(pageId, req.userId, parsed.data);
        if ("error" in result) {
            return res.status(403).json({ success: false, message: result.error });
        }

        return res.status(201).json({ success: true, data: result.block });
    } catch (error) {
        console.error("Create block error:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

export const updateBlockController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Authentication required." });
        }

        const blockId = Array.isArray(req.params.blockId)
            ? req.params.blockId[0]
            : req.params.blockId;

        if (!blockId) {
            return res.status(400).json({ success: false, message: "Block ID is required." });
        }

        const parsed = updateBlockSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: parsed.error.issues[0]?.message || "Validation failed.",
            });
        }

        const result = await updateBlock(blockId, req.userId, parsed.data);
        if ("error" in result) {
            return res.status(403).json({ success: false, message: result.error });
        }

        return res.status(200).json({ success: true, data: result.block });
    } catch (error) {
        console.error("Update block error:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

export const deleteBlockController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Authentication required." });
        }

        const blockId = Array.isArray(req.params.blockId)
            ? req.params.blockId[0]
            : req.params.blockId;

        if (!blockId) {
            return res.status(400).json({ success: false, message: "Block ID is required." });
        }

        const result = await deleteBlock(blockId, req.userId);
        if ("error" in result) {
            return res.status(403).json({ success: false, message: result.error });
        }

        return res.status(200).json({ success: true, message: "Block deleted successfully." });
    } catch (error) {
        console.error("Delete block error:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

export const batchSaveBlocksController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Authentication required." });
        }

        const pageId = Array.isArray(req.params.pageId)
            ? req.params.pageId[0]
            : req.params.pageId;

        if (!pageId) {
            return res.status(400).json({ success: false, message: "Page ID is required." });
        }

        const parsed = batchSaveBlocksSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: parsed.error.issues[0]?.message || "Validation failed.",
            });
        }

        const result = await batchSaveBlocks(pageId, req.userId, parsed.data);
        if ("error" in result) {
            return res.status(403).json({ success: false, message: result.error });
        }

        return res.status(200).json({ success: true, data: result.blocks });
    } catch (error) {
        console.error("Batch save blocks error:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};
