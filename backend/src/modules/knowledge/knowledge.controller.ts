import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { getWorkspaceMembership } from "../workspace/workspace.authorization.js";
import { knowledgeRagService } from "./knowledge-rag.service.js";

/**
 * Perform semantic search over workspace knowledge (documents & pages)
 */
export const searchWorkspaceKnowledgeController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        const workspaceId = req.params.workspaceId as string;
        const userId = req.userId;
        const query = (req.query.q as string) || (req.body?.query as string) || "";
        const limit = Number(req.query.limit) || 6;

        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        // Strict workspace membership isolation check
        const membership = await getWorkspaceMembership(workspaceId, userId);
        if (!membership) {
            res.status(403).json({
                success: false,
                message: "You do not have access to this workspace's knowledge base",
            });
            return;
        }

        if (!query.trim()) {
            res.json({ success: true, data: [] });
            return;
        }

        const results = await knowledgeRagService.semanticSearch(
            workspaceId,
            query.trim(),
            limit
        );

        res.json({
            success: true,
            data: results,
        });
    } catch (error: any) {
        console.error("Semantic search failed:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to execute semantic search",
        });
    }
};

/**
 * Ask a RAG question answered strictly from the workspace knowledge base
 */
export const askWorkspaceKnowledgeController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        const workspaceId = req.params.workspaceId as string;
        const userId = req.userId;
        const question = req.body?.question as string;

        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        // Strict workspace membership check
        const membership = await getWorkspaceMembership(workspaceId, userId);
        if (!membership) {
            res.status(403).json({
                success: false,
                message: "You do not have access to this workspace's knowledge base",
            });
            return;
        }

        if (!question || !question.trim()) {
            res.status(400).json({
                success: false,
                message: "A question is required",
            });
            return;
        }

        const result = await knowledgeRagService.askWorkspaceKnowledge(
            workspaceId,
            question.trim()
        );

        res.json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        console.error("RAG query failed:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to process question",
        });
    }
};

/**
 * Manually trigger indexing of a document or page
 */
export const indexResourceController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        const workspaceId = req.params.workspaceId as string;
        const userId = req.userId;
        const { documentId, pageId } = req.body || {};

        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const membership = await getWorkspaceMembership(workspaceId, userId);
        if (!membership) {
            res.status(403).json({
                success: false,
                message: "You do not have access to this workspace",
            });
            return;
        }

        let chunkCount = 0;
        if (documentId) {
            chunkCount = await knowledgeRagService.indexDocument(documentId);
        } else if (pageId) {
            chunkCount = await knowledgeRagService.indexPage(pageId);
        } else {
            res.status(400).json({
                success: false,
                message: "Either documentId or pageId must be provided",
            });
            return;
        }

        res.json({
            success: true,
            data: { chunkCount },
            message: `Successfully indexed ${chunkCount} chunks into knowledge base`,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to index resource",
        });
    }
};
