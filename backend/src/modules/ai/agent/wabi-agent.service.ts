import { toolOrchestrator } from "../tools/tool.orchestrator.js";
import type { ToolExecutionContext } from "../tools/tool.interface.js";
import { aiService } from "../ai.service.js";
import { prisma } from "../../../config/prisma.js";

export interface AgentReasoningStep {
    stepNumber: number;
    thought: string;
    action?: string;
    actionInput?: any;
    observation?: any;
    durationMs?: number;
}

export interface AgentConfirmationRequest {
    confirmationId: string;
    toolName: string;
    params: any;
    message: string;
}

export interface WabiAgentResponse {
    answer: string;
    thoughtProcess: string;
    requiresConfirmation?: boolean;
    confirmation?: AgentConfirmationRequest;
    steps: AgentReasoningStep[];
    toolLogs: Array<{
        timestamp: string;
        toolName: string;
        params: any;
        result?: any;
        error?: string | undefined;
        durationMs: number;
    }>;
}

// In-memory pending confirmation store (expires after 15 minutes)
const pendingConfirmations = new Map<
    string,
    {
        userId: string;
        workspaceId: string;
        toolName: string;
        params: any;
        createdAt: number;
    }
>();

export class WabiAgentService {
    /**
     * Executes the controlled Wabi Agent reasoning loop.
     * Gathers project state, today's schedule, task dependencies, and workspace knowledge
     * to answer queries or plan actions.
     */
    async runAgent(
        userInput: string,
        context: ToolExecutionContext,
        options?: {
            projectId?: string;
            conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
        }
    ): Promise<WabiAgentResponse> {
        const steps: AgentReasoningStep[] = [];
        const toolLogs: WabiAgentResponse["toolLogs"] = [];

        // 1. Gather baseline context regarding workspace and project state
        const availableProjects = await prisma.project.findMany({
            where: { workspaceId: context.workspaceId },
            select: { id: true, name: true },
            take: 5,
        });

        const activeProjectId = options?.projectId || (availableProjects[0]?.id ?? undefined);

        // 2. Fetch tool catalog for agent reasoning
        const tools = toolOrchestrator.getAvailableTools();
        const toolDocs = tools
            .map((t) => {
                let schemaKeys = "params";
                const p = t.parameters as any;
                if (p && typeof p.shape === "object") {
                    schemaKeys = Object.keys(p.shape).join(", ");
                } else if (p && typeof p._def?.shape === "object") {
                    schemaKeys = Object.keys(p._def.shape).join(", ");
                }
                return `- ${t.name}(${schemaKeys}): ${t.description} ${t.requiresConfirmation ? "[REQUIRES_CONFIRMATION]" : ""}`;
            })
            .join("\n");

        // 3. Construct Reasoning System Prompt
        const systemPrompt = `You are Wabi, an intelligent, proactive Project & Work Agent.
You assist developers and teams in prioritizing work, diagnosing delays, unblocking milestones, rescheduling tasks, and maintaining momentum.

AVAILABLE BACKEND TOOLS:
${toolDocs}

WORKSPACE CONTEXT:
- Workspace ID: "${context.workspaceId}"
- Known Projects: ${JSON.stringify(availableProjects)}
- Target Project ID: ${activeProjectId ? `"${activeProjectId}"` : "None"}

HOW TO REASON:
1. "What should I work on today?": Check getTodayPlan and getBlockedTasks. Prioritize high-impact, unblocked tasks.
2. "Why is my project delayed?": Check getProjectProgress and replanProject to spot overrun minutes and velocity bottlenecks.
3. "What is blocking the X milestone?": Check getBlockedTasks or getProjectTasks. Inspect incomplete dependencies.
4. "I finished X. What should I do next?": Mark completeTask if requested, then check next unblocked dependent task in getTodayPlan or getProjectTasks.
5. "Move the documentation task to next week": Call updateTask with new dueDate or task title.
6. "I can't finish this task today. Replan my project": Call replanProject. If applying major rebalancing, check applyReplanChanges.

DECISION PROTOCOL:
Respond strictly in JSON with one of two modes:

Mode A (Tool Call Required):
{
  "thought": "Reasoning about what information is needed or what action to take",
  "toolName": "nameOfTool",
  "toolParams": { ...parameters... }
}

Mode B (Final Response):
{
  "thought": "Conclusion or direct answer reasoning",
  "finalAnswer": "Helpful, structured response for the user with next actions, explanations, or questions."
}

Do NOT output raw markdown code blocks. Output pure JSON.`;

        // Reasoning Step 1: Agent decides initial action or answer
        let decisionRaw = "";
        try {
            decisionRaw = await aiService.generateText(
                `User Question: "${userInput}"\n\nReason and determine your tool call or final response:`,
                {
                    systemPrompt,
                    json: true,
                    temperature: 0.1,
                    timeoutMs: 40000,
                }
            );
        } catch (err: any) {
            console.error("Agent initial reasoning error:", err);
            return {
                answer: `I could not complete your request: ${err.message}`,
                thoughtProcess: "Initial reasoning failed.",
                steps,
                toolLogs,
            };
        }

        let decision = this.parseJsonSafe(decisionRaw);

        // If no tool is needed, respond immediately
        if (!decision || !decision.toolName) {
            const answer =
                decision?.finalAnswer ||
                decisionRaw ||
                "I've reviewed your request. How else can I assist with your tasks or projects?";
            return {
                answer,
                thoughtProcess: decision?.thought || "Direct answer formulated.",
                steps: [
                    {
                        stepNumber: 1,
                        thought: decision?.thought || "Direct response without tool call.",
                        action: "none",
                        observation: "No tool required",
                    },
                ],
                toolLogs,
            };
        }

        // Tool is selected
        const toolName = decision.toolName;
        let toolParams = decision.toolParams || {};

        // Auto-inject project ID if applicable
        if (activeProjectId && !toolParams.projectId) {
            const toolDef = tools.find((t) => t.name === toolName);
            const toolSchema = toolDef?.parameters as any;
            if (
                Boolean(toolSchema?.shape?.projectId) ||
                Boolean(toolSchema?._def?.shape?.projectId)
            ) {
                toolParams.projectId = activeProjectId;
            }
        }

        // Check if tool requires confirmation (Major or destructive changes)
        const selectedToolDef = tools.find((t) => t.name === toolName);
        if (selectedToolDef?.requiresConfirmation) {
            const confirmationId = `conf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            const message = selectedToolDef.getConfirmationMessage
                ? selectedToolDef.getConfirmationMessage(toolParams)
                : `Are you sure you want to execute ${toolName}?`;

            pendingConfirmations.set(confirmationId, {
                userId: context.userId,
                workspaceId: context.workspaceId,
                toolName,
                params: toolParams,
                createdAt: Date.now(),
            });

            return {
                answer: `This action requires your confirmation before proceeding: ${message}`,
                thoughtProcess: decision.thought || `Action ${toolName} flagged for user approval.`,
                requiresConfirmation: true,
                confirmation: {
                    confirmationId,
                    toolName,
                    params: toolParams,
                    message,
                },
                steps: [
                    {
                        stepNumber: 1,
                        thought: decision.thought,
                        action: toolName,
                        actionInput: toolParams,
                        observation: "Waiting for user confirmation.",
                    },
                ],
                toolLogs,
            };
        }

        // Execute tool safely
        const startTime = Date.now();
        console.log(`[WabiAgent] Executing tool ${toolName} with params:`, toolParams);

        const execResult = await toolOrchestrator.executeTool(toolName, toolParams, context);
        const durationMs = Date.now() - startTime;

        const logRecord = {
            timestamp: new Date().toISOString(),
            toolName,
            params: toolParams,
            result: execResult.result,
            error: execResult.error,
            durationMs,
        };
        toolLogs.push(logRecord);

        steps.push({
            stepNumber: 1,
            thought: decision.thought || `Decided to run tool ${toolName}.`,
            action: toolName,
            actionInput: toolParams,
            observation: execResult.success ? execResult.result : { error: execResult.error },
            durationMs,
        });

        // Step 4 & 5: Feed observation back to agent for final synthesized response
        const synthesisPrompt = `You are Wabi, an intelligent Project & Work Agent.
The user asked: "${userInput}"

You performed action: ${toolName}(${JSON.stringify(toolParams)})
Tool Observation:
${JSON.stringify(execResult.success ? execResult.result : { error: execResult.error }, null, 2)}

Provide a concise, direct, helpful, and insightful response directly addressing their question.
- If they asked "What should I work on today?", give clear ranked task recommendations and highlight what is unblocked.
- If they asked "Why is my project delayed?", diagnose the overrun minutes and root causes.
- If they asked "What is blocking milestone X?", name the blocked and blocking tasks clearly.
- If they moved or updated a task, confirm the change clearly.
Speak constructively and do NOT output raw JSON dumps.`;

        let finalAnswer = "";
        try {
            finalAnswer = await aiService.generateText(synthesisPrompt, {
                temperature: 0.3,
                timeoutMs: 45000,
            });
        } catch (err: any) {
            if (execResult.success) {
                finalAnswer = `Executed ${toolName} successfully:\n${JSON.stringify(execResult.result, null, 2)}`;
            } else {
                finalAnswer = `Could not execute ${toolName}: ${execResult.error}`;
            }
        }

        return {
            answer: finalAnswer.trim(),
            thoughtProcess: decision.thought || `Gave synthesized response after executing ${toolName}.`,
            steps,
            toolLogs,
        };
    }

    /**
     * Executes a pending tool confirmation approved by user
     */
    async executeConfirmedAction(
        confirmationId: string,
        context: ToolExecutionContext
    ): Promise<{ success: boolean; result?: any; error?: string }> {
        const item = pendingConfirmations.get(confirmationId);
        if (!item) {
            return {
                success: false,
                error: "Confirmation expired or not found.",
            };
        }

        if (item.userId !== context.userId || item.workspaceId !== context.workspaceId) {
            return {
                success: false,
                error: "Unauthorized confirmation attempt.",
            };
        }

        pendingConfirmations.delete(confirmationId);

        const startTime = Date.now();
        console.log(`[WabiAgent] Executing confirmed tool ${item.toolName} with params:`, item.params);
        const res = await toolOrchestrator.executeTool(item.toolName, item.params, context);
        console.log(`[WabiAgent] Finished confirmed tool in ${Date.now() - startTime}ms`);

        return res;
    }

    private parseJsonSafe(text: string): any {
        try {
            let cleaned = text.trim();
            if (cleaned.startsWith("```")) {
                cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
            }
            const firstBrace = cleaned.indexOf("{");
            const lastBrace = cleaned.lastIndexOf("}");
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
                cleaned = cleaned.slice(firstBrace, lastBrace + 1);
            }
            return JSON.parse(cleaned);
        } catch {
            return null;
        }
    }
}

export const wabiAgentService = new WabiAgentService();
