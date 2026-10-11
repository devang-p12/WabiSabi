import type { ToolDefinition, ToolExecutionContext } from "./tool.interface.js";
import {
    getProjectTool,
    getProjectTasksTool,
    getProjectProgressTool,
    getTodayPlanTool,
    getBlockedTasksTool,
    createTaskTool,
    updateTaskTool,
    completeTaskTool,
    createMilestoneTool,
    createDependencyTool,
    replanProjectTool,
    searchWorkspaceKnowledgeTool,
    applyReplanChangesTool,
} from "./tool.registry.js";
import { aiService } from "../ai.service.js";
import { getWorkspaceMembership } from "../../workspace/workspace.authorization.js";

export interface ToolExecutionRecord {
    toolName: string;
    params: any;
    result?: any | undefined;
    error?: string | undefined;
    durationMs: number;
}

export interface OrchestrationResponse {
    thought?: string;
    toolUsed?: string;
    toolInput?: any;
    toolOutput?: any;
    response: string;
    executionHistory: ToolExecutionRecord[];
}

export class ToolOrchestrator {
    private tools: Map<string, ToolDefinition> = new Map();

    constructor() {
        this.registerTool(getProjectTool);
        this.registerTool(getProjectTasksTool);
        this.registerTool(getProjectProgressTool);
        this.registerTool(getTodayPlanTool);
        this.registerTool(getBlockedTasksTool);
        this.registerTool(createTaskTool);
        this.registerTool(updateTaskTool);
        this.registerTool(completeTaskTool);
        this.registerTool(createMilestoneTool);
        this.registerTool(createDependencyTool);
        this.registerTool(replanProjectTool);
        this.registerTool(searchWorkspaceKnowledgeTool);
        this.registerTool(applyReplanChangesTool);
    }

    registerTool(tool: ToolDefinition): void {
        this.tools.set(tool.name, tool);
    }

    getAvailableTools(): ToolDefinition[] {
        return Array.from(this.tools.values());
    }

    /**
     * Executes a registered tool safely with authentication, workspace checks, and Zod validation.
     */
    async executeTool(
        toolName: string,
        rawParams: any,
        context: ToolExecutionContext
    ): Promise<{ success: boolean; result?: any; error?: string }> {
        const tool = this.tools.get(toolName);
        if (!tool) {
            return {
                success: false,
                error: `Tool "${toolName}" is not recognized or not allowed.`,
            };
        }

        // Authorization check: User must be an active member of this workspace
        const membership = await getWorkspaceMembership(context.workspaceId, context.userId);
        if (!membership) {
            return {
                success: false,
                error: "Unauthorized: You do not have access to this workspace.",
            };
        }

        // Validation check
        const parseResult = tool.parameters.safeParse(rawParams);
        if (!parseResult.success) {
            return {
                success: false,
                error: `Invalid tool parameters: ${parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`,
            };
        }

        try {
            const result = await tool.execute(parseResult.data, context);
            return { success: true, result };
        } catch (err: any) {
            return {
                success: false,
                error: err.message || "Tool execution failed.",
            };
        }
    }

    /**
     * 5-Step Orchestration Cycle:
     * 1. Understand user request.
     * 2. Decide whether a tool is needed.
     * 3. Execute allowed tool with validated context.
     * 4. Feed result back to model.
     * 5. Produce final natural language response.
     */
    async orchestrate(
        userInput: string,
        context: ToolExecutionContext,
        systemContext?: { projectId?: string }
    ): Promise<OrchestrationResponse> {
        const executionHistory: ToolExecutionRecord[] = [];

        // Build list of tools description for LLM
        const toolDocs = Array.from(this.tools.values())
            .map((t) => {
                let schemaKeys = "params";
                const paramsObj = t.parameters as any;
                if (paramsObj && typeof paramsObj.shape === "object") {
                    schemaKeys = Object.keys(paramsObj.shape).join(", ");
                } else if (paramsObj && typeof paramsObj._def?.shape === "object") {
                    schemaKeys = Object.keys(paramsObj._def.shape).join(", ");
                }
                return `- ${t.name}(${schemaKeys}): ${t.description}`;
            })
            .join("\n");

        const decisionPrompt = `You are Wabi's Intelligent Project Assistant.
You have access to the following controlled backend tools:

${toolDocs}

Context:
Workspace ID: "${context.workspaceId}"
${systemContext?.projectId ? `Active Project ID: "${systemContext.projectId}"` : ""}

User Request: "${userInput}"

Your task:
Determine if a tool should be executed to answer or fulfill the user's request.
If a tool IS needed, output JSON:
{
  "needTool": true,
  "thought": "brief explanation of reasoning",
  "toolName": "nameOfTool",
  "toolParams": { ...parameters... }
}

If NO tool is needed (e.g. conversational question, general advice, or greeting), output JSON:
{
  "needTool": false,
  "thought": "brief explanation",
  "directResponse": "natural response to the user"
}

Respond ONLY with valid JSON. No markdown code blocks.`;

        let decisionRaw = "";
        try {
            decisionRaw = await aiService.generateText(decisionPrompt, {
                json: true,
                temperature: 0.1,
                timeoutMs: 30000,
            });
        } catch (err: any) {
            console.warn("AI decision step failed:", err);
            return {
                response: `I'm having trouble processing that right now: ${err.message}`,
                executionHistory,
            };
        }

        // Clean and parse decision
        let decision: any = null;
        try {
            let cleaned = decisionRaw.trim();
            if (cleaned.startsWith("```")) {
                cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
            }
            const firstBrace = cleaned.indexOf("{");
            const lastBrace = cleaned.lastIndexOf("}");
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
                cleaned = cleaned.slice(firstBrace, lastBrace + 1);
            }
            decision = JSON.parse(cleaned);
        } catch (e) {
            console.warn("Could not parse AI decision JSON:", decisionRaw);
        }

        // Case A: No tool needed
        if (!decision || !decision.needTool) {
            return {
                thought: decision?.thought || "Direct response generated without tools.",
                response: decision?.directResponse || decisionRaw || "How can I assist you with your projects today?",
                executionHistory,
            };
        }

        // Case B: Tool needed
        const toolName = decision.toolName;
        let toolParams = decision.toolParams || {};

        // Auto-inject active projectId if the tool needs it and was omitted
        if (systemContext?.projectId && !toolParams.projectId) {
            const tool = this.tools.get(toolName);
            const toolSchema = tool?.parameters as any;
            const hasProjectId =
                Boolean(toolSchema?.shape?.projectId) ||
                Boolean(toolSchema?._def?.shape?.projectId);
            if (hasProjectId) {
                toolParams.projectId = systemContext.projectId;
            }
        }

        const startTime = Date.now();
        const execResult = await this.executeTool(toolName, toolParams, context);
        const durationMs = Date.now() - startTime;

        const record: ToolExecutionRecord = {
            toolName,
            params: toolParams,
            result: execResult.result,
            error: execResult.error,
            durationMs,
        };
        executionHistory.push(record);

        // Feed result back to model for synthesis (Step 4 & 5)
        const synthesisPrompt = `You are Wabi's Intelligent Project Assistant.
The user asked: "${userInput}"

You executed tool "${toolName}" with parameters: ${JSON.stringify(toolParams)}.
Tool Result:
${JSON.stringify(execResult.success ? execResult.result : { error: execResult.error }, null, 2)}

Provide a clear, helpful, and professional natural language response to the user based on the tool results.
Explain what was retrieved or what action was executed cleanly. Do NOT dump raw JSON to the user.`;

        let finalResponse = "";
        try {
            finalResponse = await aiService.generateText(synthesisPrompt, {
                temperature: 0.3,
                timeoutMs: 45000,
            });
        } catch (err: any) {
            // Fallback response if synthesis times out
            if (execResult.success) {
                finalResponse = `Executed ${toolName} successfully:\n${JSON.stringify(execResult.result, null, 2)}`;
            } else {
                finalResponse = `Could not complete ${toolName}: ${execResult.error}`;
            }
        }

        return {
            thought: decision.thought,
            toolUsed: toolName,
            toolInput: toolParams,
            toolOutput: execResult.result || { error: execResult.error },
            response: finalResponse.trim(),
            executionHistory,
        };
    }
}

export const toolOrchestrator = new ToolOrchestrator();
