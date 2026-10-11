import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { aiService } from "./ai.service.js";
import {
    aiTestPromptSchema,
    analyzeProjectInputSchema,
    applyProjectPlanSchema,
    applyAdaptiveReplanSchema,
} from "./ai.schemas.js";
import { toolOrchestrator } from "./tools/tool.orchestrator.js";
import { wabiAgentService } from "./agent/wabi-agent.service.js";

/**
 * GET /api/v1/ai/health
 * Verifies whether the configured AI service/Ollama is reachable.
 */
export const getAIHealthController = async (
    _req: Request,
    res: Response
) => {
    try {
        const health = await aiService.checkHealth();

        return res.status(health.healthy ? 200 : 503).json({
            success: health.healthy,
            data: health,
        });
    } catch (error: any) {
        console.error("AI health check error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to check AI service health.",
        });
    }
};

/**
 * POST /api/v1/ai/projects/analyze
 * Analyzes an informal project idea/description and produces a structured project plan.
 * Analysis only - does NOT create database records.
 */
export const analyzeProjectController = async (
    req: Request,
    res: Response
) => {
    try {
        const parseResult = analyzeProjectInputSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: parseResult.error.flatten().fieldErrors,
            });
        }

        const { input } = parseResult.data;
        const projectPlan = await aiService.analyzeProject(input);

        return res.status(200).json({
            success: true,
            data: projectPlan,
        });
    } catch (error: any) {
        console.error("Project analysis error:", error);

        const errorMessage = error?.message || "Failed to analyze project.";
        const isConnectionError =
            errorMessage.includes("Failed to connect") ||
            errorMessage.includes("ECONNREFUSED") ||
            errorMessage.includes("AbortError") ||
            errorMessage.includes("timed out");

        if (isConnectionError) {
            return res.status(503).json({
                success: false,
                error: {
                    code: "AI_SERVICE_UNAVAILABLE",
                    message: "The local AI service is currently unreachable.",
                    details: errorMessage,
                },
            });
        }

        const isInvalidAIOutput =
            errorMessage.includes("Failed to parse AI output") ||
            errorMessage.includes("AI generated an invalid project plan structure");

        if (isInvalidAIOutput) {
            return res.status(422).json({
                success: false,
                error: {
                    code: "INVALID_AI_OUTPUT",
                    message: "The AI generated an invalid response structure.",
                    details: errorMessage,
                },
            });
        }

        return res.status(500).json({
            success: false,
            error: {
                code: "AI_ANALYSIS_FAILED",
                message: errorMessage,
            },
        });
    }
};

/**
 * POST /api/v1/ai/projects/create-from-plan
 * Creates a project, milestones, tasks, and task dependencies from an approved plan.
 * Executes atomically in a Prisma transaction with full rollback on error.
 */
export const createProjectFromApprovedPlanController = async (
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

        const parseResult = applyProjectPlanSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: parseResult.error.flatten().fieldErrors,
            });
        }

        const { workspaceId, boardId, plan } = parseResult.data;
        const result = await aiService.createApprovedProject(
            workspaceId,
            req.userId,
            plan,
            boardId
        );

        if ("error" in result) {
            return res.status(403).json({
                success: false,
                message: result.error,
            });
        }

        return res.status(201).json({
            success: true,
            data: result.project,
        });
    } catch (error: any) {
        console.error("Create project from approved plan error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to create project from plan.",
        });
    }
};

/**
 * POST /api/v1/ai/projects/:projectId/replan
 * Phase 9: Analyzes project velocity, delays, blocked dependencies, and produces
 * a structured adaptive replan with Current Situation, Risk, and Suggested Changes.
 */
export const generateAdaptiveReplanController = async (
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

        const projectId = Array.isArray(req.params.projectId)
            ? req.params.projectId[0]
            : req.params.projectId;

        if (!projectId) {
            return res.status(400).json({
                success: false,
                message: "Project ID is required.",
            });
        }

        const result = await aiService.generateAdaptiveReplan(projectId, req.userId);

        if (result.error) {
            return res.status(403).json({
                success: false,
                message: result.error,
            });
        }

        return res.status(200).json({
            success: true,
            data: result.replan,
        });
    } catch (error: any) {
        console.error("Generate adaptive replan controller error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to generate adaptive replan.",
        });
    }
};

/**
 * POST /api/v1/ai/projects/:projectId/replan/apply
 * Phase 9: Explicit user approval endpoint applying chosen replan suggestions in PostgreSQL.
 */
export const applyAdaptiveReplanController = async (
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

        const projectId = Array.isArray(req.params.projectId)
            ? req.params.projectId[0]
            : req.params.projectId;

        if (!projectId) {
            return res.status(400).json({
                success: false,
                message: "Project ID is required.",
            });
        }

        const parseResult = applyAdaptiveReplanSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: parseResult.error.flatten().fieldErrors,
            });
        }

        const result = await aiService.applyAdaptiveReplanChanges(
            projectId,
            req.userId,
            parseResult.data
        );

        if (result.error) {
            return res.status(403).json({
                success: false,
                message: result.error,
            });
        }

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        console.error("Apply adaptive replan controller error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to apply adaptive replan.",
        });
    }
};

/**
 * POST /api/v1/ai/test
 * Optional test endpoint to verify text generation with the configured AI provider.
 */
export const testAIPromptController = async (
    req: Request,
    res: Response
) => {
    try {
        const parseResult = aiTestPromptSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: parseResult.error.flatten().fieldErrors,
            });
        }

        const { prompt, systemPrompt, temperature } = parseResult.data;
        const response = await aiService.generateText(prompt, {
            systemPrompt: systemPrompt ?? undefined,
            temperature: temperature ?? undefined,
        });

        return res.status(200).json({
            success: true,
            data: {
                provider: aiService.getProviderInfo().name,
                model: aiService.getProviderInfo().model,
                response,
            },
        });
    } catch (error: any) {
        console.error("AI prompt test error:", error);
        return res.status(502).json({
            success: false,
            message: error.message || "Failed to generate AI response from provider.",
        });
    }
};

/**
 * POST /api/v1/ai/workspaces/:workspaceId/orchestrate
 * Phase 13: Understands user request, decides if a tool is needed, executes allowed tool,
 * and synthesizes final response.
 */
export const orchestratePromptController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        const workspaceId = req.params.workspaceId as string;
        const userId = req.userId;
        const { prompt, projectId } = req.body || {};

        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
            res.status(400).json({ success: false, message: "A non-empty prompt is required." });
            return;
        }

        const result = await toolOrchestrator.orchestrate(
            prompt.trim(),
            { userId, workspaceId },
            { ...(projectId ? { projectId } : {}) }
        );

        res.json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        console.error("AI tool orchestration failed:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to orchestrate AI tool execution.",
        });
    }
};

/**
 * GET /api/v1/ai/tools
 * Lists registered backend tools available to the AI system
 */
export const listToolsController = async (
    _req: Request,
    res: Response
) => {
    const tools = toolOrchestrator.getAvailableTools().map((t) => ({
        name: t.name,
        description: t.description,
    }));
    res.json({ success: true, data: tools });
};

/**
 * POST /api/v1/ai/workspaces/:workspaceId/agent/chat
 * Phase 14: Controlled Wabi Agent reasoning loop across project state, tasks, dependencies,
 * today plan, and workspace knowledge.
 */
export const runAgentController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        const workspaceId = req.params.workspaceId as string;
        const userId = req.userId;
        const { message, projectId, conversationHistory } = req.body || {};

        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        if (!message || typeof message !== "string" || !message.trim()) {
            res.status(400).json({ success: false, message: "A message string is required." });
            return;
        }

        const result = await wabiAgentService.runAgent(
            message.trim(),
            { userId, workspaceId },
            {
                ...(projectId ? { projectId } : {}),
                ...(conversationHistory ? { conversationHistory } : {}),
            }
        );

        res.json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        console.error("Wabi Agent execution failed:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to execute Wabi Agent reasoning.",
        });
    }
};

/**
 * POST /api/v1/ai/workspaces/:workspaceId/agent/confirm
 * Phase 14: Confirms and executes an action flagged for user approval
 */
export const confirmAgentActionController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        const workspaceId = req.params.workspaceId as string;
        const userId = req.userId;
        const { confirmationId } = req.body || {};

        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        if (!confirmationId) {
            res.status(400).json({ success: false, message: "confirmationId is required." });
            return;
        }

        const result = await wabiAgentService.executeConfirmedAction(
            confirmationId,
            { userId, workspaceId }
        );

        if (!result.success) {
            res.status(400).json({
                success: false,
                message: result.error || "Confirmation failed.",
            });
            return;
        }

        res.json({
            success: true,
            data: result.result,
        });
    } catch (error: any) {
        console.error("Wabi Agent confirmation failed:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to execute confirmed agent action.",
        });
    }
};


