import type {
    AIChatMessage,
    AICompletionOptions,
    AIProvider,
    AIProviderHealthCheckResult,
} from "./providers/ai-provider.js";
import { OllamaProvider } from "./providers/ollama.provider.js";
import {
    analyzedProjectPlanSchema,
    adaptiveReplanResultSchema,
    type AnalyzedProjectPlan,
    type AdaptiveReplanResult,
    type ApplyAdaptiveReplanInput,
} from "./ai.schemas.js";
import { prisma } from "../../config/prisma.js";
import { getWorkspaceMembership } from "../workspace/workspace.authorization.js";
import { getTodayPlan } from "../planner/planner.service.js";

export class AIService {
    private provider: AIProvider;

    constructor(provider?: AIProvider) {
        // Defaults to OllamaProvider as configured via environment variables
        this.provider = provider ?? new OllamaProvider();
    }

    /**
     * Swap or update provider implementation at runtime if needed
     */
    setProvider(provider: AIProvider): void {
        this.provider = provider;
    }

    /**
     * Returns provider summary information without exposing provider internals
     */
    getProviderInfo(): { name: string; model: string; baseUrl: string } {
        return {
            name: this.provider.name,
            model: this.provider.defaultModel,
            baseUrl: this.provider.baseUrl,
        };
    }

    /**
     * Checks if the configured AI provider backend is reachable and functioning
     */
    async checkHealth(): Promise<AIProviderHealthCheckResult> {
        return this.provider.checkHealth();
    }

    /**
     * Generates a text completion from a prompt using the configured AIProvider
     */
    async generateText(
        prompt: string,
        options?: AICompletionOptions
    ): Promise<string> {
        return this.provider.generateText(prompt, options);
    }

    /**
     * Executes a chat completion conversation using the configured AIProvider
     */
    async chat(
        messages: AIChatMessage[],
        options?: AICompletionOptions
    ): Promise<string> {
        return this.provider.chat(messages, options);
    }

    /**
     * Generates a vector embedding for a single text chunk
     */
    async generateEmbedding(text: string): Promise<number[]> {
        if (this.provider.generateEmbedding) {
            return this.provider.generateEmbedding(text);
        }
        return [];
    }

    /**
     * Generates vector embeddings for a list of text chunks
     */
    async generateEmbeddings(texts: string[]): Promise<number[][]> {
        if (this.provider.generateEmbeddings) {
            return this.provider.generateEmbeddings(texts);
        }
        return [];
    }

    /**
     * Analyzes project description input and produces a validated structured project plan
     */
    async analyzeProject(input: string): Promise<AnalyzedProjectPlan> {
        const systemPrompt = `You are an expert software project architect.
Your job is to analyze the user's project idea, timeframe, and goals to produce a realistic, structured project plan.

You MUST respond ONLY with a single JSON object conforming to this exact schema:
{
  "name": "Concise Project Name",
  "goal": "A clear, compelling summary of the project goal and deliverables",
  "milestones": [
    {
      "title": "Milestone Title",
      "description": "Scope of this milestone",
      "tasks": [
        {
          "title": "Actionable Task Title",
          "description": "Specific details of what to build or do",
          "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
          "estimatedMinutes": 60,
          "dependencies": ["Earlier Task Title If Any"]
        }
      ]
    }
  ]
}

Rules:
1. Divide the project into logical sequential milestones (usually 2 to 5 milestones).
2. Each milestone must contain actionable tasks with realistic estimatedMinutes.
3. Priority must be one of: "LOW", "MEDIUM", "HIGH", "URGENT".
4. Dependencies must list any prerequisite task titles that must be completed before this task (or empty array []).
5. Return ONLY pure JSON. No markdown backticks, no comments, no surrounding text.`;

        const userPrompt = `Project Input:
${input}

Analyze this project and generate the structured project plan in JSON.`;

        const rawResponse = await this.provider.generateText(userPrompt, {
            systemPrompt,
            json: true,
            temperature: 0.2,
            timeoutMs: 180000,
        });

        return this.parseAndValidateProjectPlan(rawResponse);
    }

    /**
     * Sanitizes, parses, and validates the LLM output against the strict Zod schema.
     */
    private parseAndValidateProjectPlan(rawResponse: string): AnalyzedProjectPlan {
        if (!rawResponse || typeof rawResponse !== "string" || !rawResponse.trim()) {
            throw new Error("AI provider returned an empty response.");
        }

        let cleaned = rawResponse.trim();
        // Remove markdown code fences if present
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
        }

        // Isolate JSON object between first '{' and last '}'
        const firstBrace = cleaned.indexOf("{");
        const lastBrace = cleaned.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
            cleaned = cleaned.slice(firstBrace, lastBrace + 1);
        }

        let parsed: unknown;
        try {
            parsed = JSON.parse(cleaned);
        } catch (jsonErr: any) {
            throw new Error(
                `Failed to parse AI output as JSON: ${jsonErr.message}. Raw output snippet: ${cleaned.slice(0, 150)}`
            );
        }

        // Unwrap if nested under common root keys
        let target = parsed;
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            const obj = parsed as Record<string, any>;
            if (obj.project && typeof obj.project === "object" && !Array.isArray(obj.project)) {
                target = obj.project;
            } else if (obj.plan && typeof obj.plan === "object" && !Array.isArray(obj.plan)) {
                target = obj.plan;
            } else if (obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)) {
                target = obj.data;
            }
        }

        const parseResult = analyzedProjectPlanSchema.safeParse(target);
        if (!parseResult.success) {
            const formattedErrors = parseResult.error.issues
                .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
                .join("; ");
            throw new Error(`AI generated an invalid project plan structure: ${formattedErrors}`);
        }

        const plan = parseResult.data;

        // Compute totalEstimatedMinutes across all milestone tasks
        let totalEstimatedMinutes = 0;
        for (const milestone of plan.milestones) {
            for (const task of milestone.tasks) {
                totalEstimatedMinutes += task.estimatedMinutes;
            }
        }

        return {
            ...plan,
            totalEstimatedMinutes,
        };
    }

    /**
     * Creates a project and its milestones, tasks, and task dependencies
     * in PostgreSQL atomically within a Prisma transaction after explicit user approval.
     */
    async createApprovedProject(
        workspaceId: string,
        userId: string,
        plan: AnalyzedProjectPlan,
        boardId?: string
    ) {
        // Validate user belongs to workspace
        const membership = await getWorkspaceMembership(workspaceId, userId);
        if (!membership) {
            return {
                error: "You are not a member of this workspace.",
            } as const;
        }

        // Execute atomic creation in Prisma transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Resolve or create board & list if needed for tasks
            let targetListId: string | null = null;

            if (boardId) {
                const board = await tx.board.findUnique({
                    where: { id: boardId },
                    include: { lists: { orderBy: { position: "asc" } } },
                });
                if (board && board.workspaceId === workspaceId) {
                    if (board.lists.length > 0) {
                        targetListId = board.lists[0]?.id ?? null;
                    } else {
                        const newList = await tx.boardList.create({
                            data: {
                                name: "To Do",
                                boardId: board.id,
                                position: 0,
                            },
                        });
                        targetListId = newList.id;
                    }
                }
            }

            // If no board provided or found, look for any existing board in workspace
            if (!targetListId) {
                const firstBoard = await tx.board.findFirst({
                    where: { workspaceId },
                    include: { lists: { orderBy: { position: "asc" } } },
                });

                if (firstBoard) {
                    if (firstBoard.lists.length > 0) {
                        targetListId = firstBoard.lists[0]?.id ?? null;
                    } else {
                        const newList = await tx.boardList.create({
                            data: {
                                name: "To Do",
                                boardId: firstBoard.id,
                                position: 0,
                            },
                        });
                        targetListId = newList.id;
                    }
                } else {
                    // Create a default board and "To Do" list for the project tasks
                    const defaultBoard = await tx.board.create({
                        data: {
                            name: `${plan.name} Board`,
                            description: `Board for ${plan.name}`,
                            workspaceId,
                        },
                    });
                    const defaultList = await tx.boardList.create({
                        data: {
                            name: "To Do",
                            boardId: defaultBoard.id,
                            position: 0,
                        },
                    });
                    targetListId = defaultList.id;
                }
            }

            if (!targetListId) {
                throw new Error("Unable to establish or find a list for project tasks.");
            }

            // 2. Create Project record
            const project = await tx.project.create({
                data: {
                    name: plan.name,
                    description: plan.goal,
                    workspaceId,
                },
            });

            // Map task title (and id) to created Task record ID for dependency linking
            const taskTitleToIdMap = new Map<string, string>();
            const dependencyLinksToCreate: Array<{
                taskId: string;
                dependsOnTitle: string;
            }> = [];

            // 3. Create Milestones and Tasks
            for (let mIdx = 0; mIdx < plan.milestones.length; mIdx++) {
                const m = plan.milestones[mIdx]!;
                const milestone = await tx.milestone.create({
                    data: {
                        title: m.title,
                        position: mIdx,
                        projectId: project.id,
                    },
                });

                for (let tIdx = 0; tIdx < m.tasks.length; tIdx++) {
                    const t = m.tasks[tIdx]!;
                    const task = await tx.task.create({
                        data: {
                            title: t.title,
                            description: t.description || null,
                            priority: t.priority,
                            estimatedMinutes: t.estimatedMinutes,
                            position: tIdx,
                            listId: targetListId,
                            projectId: project.id,
                            milestoneId: milestone.id,
                        },
                    });

                    // Track title (normalized lowercase & trimmed) for dependency resolution
                    taskTitleToIdMap.set(t.title.trim().toLowerCase(), task.id);

                    if (t.dependencies && t.dependencies.length > 0) {
                        for (const depTitle of t.dependencies) {
                            if (depTitle.trim()) {
                                dependencyLinksToCreate.push({
                                    taskId: task.id,
                                    dependsOnTitle: depTitle.trim().toLowerCase(),
                                });
                            }
                        }
                    }
                }
            }

            // 4. Create Dependencies where provided
            for (const link of dependencyLinksToCreate) {
                const dependsOnId = taskTitleToIdMap.get(link.dependsOnTitle);
                // Ensure target exists and avoids self-dependency
                if (dependsOnId && dependsOnId !== link.taskId) {
                    await tx.taskDependency.upsert({
                        where: {
                            taskId_dependsOnId: {
                                taskId: link.taskId,
                                dependsOnId,
                            },
                        },
                        create: {
                            taskId: link.taskId,
                            dependsOnId,
                        },
                        update: {},
                    });
                }
            }

            // Return created project with milestones, tasks count, and workspace
            return tx.project.findUnique({
                where: { id: project.id },
                include: {
                    milestones: {
                        orderBy: { position: "asc" },
                        include: {
                            tasks: {
                                orderBy: { position: "asc" },
                                include: {
                                    dependencies: {
                                        include: {
                                            dependsOn: {
                                                select: {
                                                    id: true,
                                                    title: true,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    tasks: {
                        select: {
                            id: true,
                            title: true,
                            completed: true,
                            priority: true,
                            estimatedMinutes: true,
                            milestoneId: true,
                        },
                    },
                    workspace: {
                        select: {
                            id: true,
                            name: true,
                            boards: {
                                select: {
                                    id: true,
                                    name: true,
                                    description: true,
                                },
                            },
                        },
                    },
                    _count: {
                        select: {
                            tasks: true,
                            milestones: true,
                        },
                    },
                },
            });
        });

        if (!result) {
            return {
                error: "Failed to create project from plan.",
            } as const;
        }

        const totalTasks = result.tasks.length;
        const completedTasks = result.tasks.filter((t) => t.completed).length;
        const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
            project: {
                ...result,
                totalTasks,
                completedTasks,
                progressPercentage,
            },
        } as const;
    }

    /**
     * Phase 9: Generates an AI-assisted adaptive replan for a project based on real progress,
     * time variances (estimatedMinutes vs actualMinutes), blocked tasks, due dates, and today's plan.
     */
    async generateAdaptiveReplan(
        projectId: string,
        userId: string
    ): Promise<{ error?: string; replan?: AdaptiveReplanResult }> {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                workspace: true,
                milestones: {
                    orderBy: { position: "asc" },
                },
                tasks: {
                    include: {
                        dependencies: {
                            include: {
                                dependsOn: {
                                    select: {
                                        id: true,
                                        title: true,
                                        completed: true,
                                    },
                                },
                            },
                        },
                        milestone: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                    },
                    orderBy: { position: "asc" },
                },
            },
        });

        if (!project) {
            return { error: "Project not found." };
        }

        const membership = await getWorkspaceMembership(project.workspaceId, userId);
        if (!membership) {
            return { error: "You do not have access to this project." };
        }

        // Today's plan context
        let todayPlanSummary = "No today's plan generated.";
        try {
            const today = await getTodayPlan({
                userId,
                workspaceId: project.workspaceId,
                projectId,
            });
            todayPlanSummary = `Planned today: ${today.plannedTimeFormatted} across ${today.summary.totalPlanned} tasks. Blocked: ${today.summary.totalBlocked} tasks.`;
        } catch {
            // Non-critical if planner is unavailable
        }

        // Compute metrics and classify tasks
        const totalTasks = project.tasks.length;
        const completedTasks = project.tasks.filter((t) => t.completed);
        const incompleteTasks = project.tasks.filter((t) => !t.completed);
        const progressPercentage =
            totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

        let totalEstimatedMinutes = 0;
        let totalActualMinutes = 0;

        const delayedTasks: Array<{
            id: string;
            title: string;
            estimatedMinutes: number;
            actualMinutes: number;
            overrunMinutes: number;
            priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
        }> = [];

        const blockedTasks: Array<{
            id: string;
            title: string;
            priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
            blockedBy: string[];
        }> = [];

        for (const t of project.tasks) {
            const est = t.estimatedMinutes ?? 60;
            const act = t.actualMinutes ?? 0;
            totalEstimatedMinutes += est;
            totalActualMinutes += act;

            // Delayed if actualMinutes exceeds estimatedMinutes
            if (act > est) {
                delayedTasks.push({
                    id: t.id,
                    title: t.title,
                    estimatedMinutes: est,
                    actualMinutes: act,
                    overrunMinutes: act - est,
                    priority: t.priority,
                });
            }

            // Blocked if any prerequisite dependency is incomplete
            if (!t.completed) {
                const pendingDeps = t.dependencies
                    .filter((d) => !d.dependsOn.completed)
                    .map((d) => d.dependsOn.title);
                if (pendingDeps.length > 0) {
                    blockedTasks.push({
                        id: t.id,
                        title: t.title,
                        priority: t.priority,
                        blockedBy: pendingDeps,
                    });
                }
            }
        }

        const varianceMinutes = totalActualMinutes - totalEstimatedMinutes;

        // Structured Context Payload for LLM
        const contextPayload = {
            project: {
                id: project.id,
                name: project.name,
                description: project.description,
                progressPercentage,
                totalTasks,
                completedCount: completedTasks.length,
                incompleteCount: incompleteTasks.length,
            },
            timeTracking: {
                totalEstimatedMinutes,
                totalActualMinutes,
                varianceMinutes,
                delayedTasksCount: delayedTasks.length,
                delayedTasksList: delayedTasks.map((d) => ({
                    id: d.id,
                    title: d.title,
                    estimated: `${d.estimatedMinutes}m`,
                    actual: `${d.actualMinutes}m`,
                    overrun: `+${d.overrunMinutes}m`,
                    priority: d.priority,
                })),
            },
            blockedTasksList: blockedTasks.map((b) => ({
                id: b.id,
                title: b.title,
                priority: b.priority,
                blockedBy: b.blockedBy,
            })),
            todayPlanContext: todayPlanSummary,
            milestones: project.milestones.map((m) => ({
                id: m.id,
                title: m.title,
            })),
            incompleteTasks: incompleteTasks.map((t) => ({
                id: t.id,
                title: t.title,
                priority: t.priority,
                estimatedMinutes: t.estimatedMinutes ?? 60,
                actualMinutes: t.actualMinutes ?? 0,
                dueDate: t.dueDate ? t.dueDate.toISOString().split("T")[0] : null,
                milestoneId: t.milestoneId,
                milestoneTitle: t.milestone?.title ?? null,
                dependencies: t.dependencies.map((d) => d.dependsOn.title),
            })),
        };

        const systemPrompt = `You are Wabi's Senior Project Delivery Director & Scrum Master.
Your job is to analyze real-world task velocity, delays, blockers, and time overruns, and produce an actionable ADAPTIVE REPLAN.

Respond ONLY with a valid JSON object matching this schema:
{
  "currentSituation": {
    "summary": "Concise summary of project health and delivery status",
    "progressPercentage": ${progressPercentage},
    "totalTasks": ${totalTasks},
    "completedTasks": ${completedTasks.length},
    "delayedTasksCount": ${delayedTasks.length},
    "blockedTasksCount": ${blockedTasks.length},
    "totalEstimatedMinutes": ${totalEstimatedMinutes},
    "totalActualMinutes": ${totalActualMinutes},
    "varianceMinutes": ${varianceMinutes}
  },
  "risk": {
    "level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    "summary": "Key delivery risk assessment statement",
    "factors": ["Specific risk factor 1", "Specific risk factor 2"]
  },
  "delayedTasks": [
    {
      "id": "task-uuid",
      "title": "Task title",
      "estimatedMinutes": 60,
      "actualMinutes": 150,
      "overrunMinutes": 90,
      "priority": "HIGH"
    }
  ],
  "blockedTasks": [
    {
      "id": "task-uuid",
      "title": "Task title",
      "priority": "MEDIUM",
      "blockedBy": ["Prerequisite Task Name"]
    }
  ],
  "suggestedChanges": [
    {
      "taskId": "task-uuid-must-match-an-incomplete-task-id",
      "taskTitle": "Task title",
      "action": "CHANGE_PRIORITY" | "ADJUST_ESTIMATE" | "RESCHEDULE" | "MOVE_MILESTONE" | "KEEP",
      "reason": "Clear explanation of why this change recovers velocity or resolves blockers",
      "suggestedPriority": "URGENT" | "HIGH" | "MEDIUM" | "LOW",
      "suggestedEstimatedMinutes": 90,
      "suggestedDueDate": "YYYY-MM-DD"
    }
  ],
  "revisedPlanSummary": "Holistic recommendation on how this revised plan gets the project back on track."
}

Rules:
1. Identify all tasks where actualMinutes > estimatedMinutes as delayed.
2. Identify all tasks waiting on uncompleted dependencies as blocked.
3. Suggest concrete, realistic changes to incomplete tasks: deprioritize non-critical tasks if behind, elevate urgent blockers, or adjust estimates.
4. For every change in "suggestedChanges", the "taskId" MUST strictly match one of the provided incomplete tasks.
5. Return ONLY pure valid JSON. No markdown fences, no conversational text.`;

        const userPrompt = `Project Execution Status Data:
${JSON.stringify(contextPayload, null, 2)}

Produce the adaptive replan analysis in JSON.`;

        try {
            const rawResponse = await this.provider.generateText(userPrompt, {
                systemPrompt,
                json: true,
                temperature: 0.2,
                timeoutMs: 180000,
            });

            const parsed = this.parseAndValidateAdaptiveReplan(
                rawResponse,
                contextPayload,
                delayedTasks,
                blockedTasks
            );

            return { replan: parsed };
        } catch (err: any) {
            console.error("Adaptive replan generation error:", err);
            // Fallback deterministic replan if AI output was invalid or timed out
            const fallback = this.generateDeterministicFallbackReplan(
                contextPayload,
                delayedTasks,
                blockedTasks
            );
            return { replan: fallback };
        }
    }

    /**
     * Sanitizes and parses LLM output into an AdaptiveReplanResult
     */
    private parseAndValidateAdaptiveReplan(
        rawResponse: string,
        contextPayload: any,
        delayedTasks: any[],
        blockedTasks: any[]
    ): AdaptiveReplanResult {
        let cleaned = rawResponse.trim();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
        }
        const firstBrace = cleaned.indexOf("{");
        const lastBrace = cleaned.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
            cleaned = cleaned.slice(firstBrace, lastBrace + 1);
        }

        const parsed = JSON.parse(cleaned);

        // Sanitize & enforce required fields
        const target = {
            currentSituation: {
                summary: parsed.currentSituation?.summary || "Project execution review in progress.",
                progressPercentage: contextPayload.project.progressPercentage,
                totalTasks: contextPayload.project.totalTasks,
                completedTasks: contextPayload.project.completedCount,
                delayedTasksCount: delayedTasks.length,
                blockedTasksCount: blockedTasks.length,
                totalEstimatedMinutes: contextPayload.timeTracking.totalEstimatedMinutes,
                totalActualMinutes: contextPayload.timeTracking.totalActualMinutes,
                varianceMinutes: contextPayload.timeTracking.varianceMinutes,
            },
            risk: {
                level: ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(parsed.risk?.level)
                    ? parsed.risk.level
                    : delayedTasks.length > 0 || blockedTasks.length > 0
                    ? "HIGH"
                    : "LOW",
                summary: parsed.risk?.summary || "Project delivery risk analyzed.",
                factors: Array.isArray(parsed.risk?.factors)
                    ? parsed.risk.factors.map(String)
                    : [],
            },
            delayedTasks: delayedTasks.map((d) => ({
                id: d.id,
                title: d.title,
                estimatedMinutes: d.estimatedMinutes,
                actualMinutes: d.actualMinutes,
                overrunMinutes: d.overrunMinutes,
                priority: d.priority,
            })),
            blockedTasks: blockedTasks.map((b) => ({
                id: b.id,
                title: b.title,
                priority: b.priority,
                blockedBy: b.blockedBy,
            })),
            suggestedChanges: Array.isArray(parsed.suggestedChanges)
                ? parsed.suggestedChanges
                      .filter((c: any) => c && typeof c.taskId === "string")
                      .map((c: any) => ({
                          taskId: c.taskId,
                          taskTitle: c.taskTitle || "Task",
                          action: c.action || "KEEP",
                          reason: c.reason || "Adaptive suggestion based on velocity",
                          ...(c.suggestedPriority ? { suggestedPriority: c.suggestedPriority } : {}),
                          ...(c.suggestedEstimatedMinutes ? { suggestedEstimatedMinutes: Number(c.suggestedEstimatedMinutes) } : {}),
                          ...(c.suggestedDueDate ? { suggestedDueDate: String(c.suggestedDueDate) } : {}),
                          ...(c.suggestedMilestoneId ? { suggestedMilestoneId: String(c.suggestedMilestoneId) } : {}),
                      }))
                : [],
            revisedPlanSummary:
                parsed.revisedPlanSummary ||
                "Plan revised to compensate for variance and prioritize active bottlenecks.",
        };

        const validated = adaptiveReplanResultSchema.safeParse(target);
        if (!validated.success) {
            throw new Error(
                `Invalid adaptive replan schema: ${validated.error.issues.map((i) => i.message).join(", ")}`
            );
        }

        return validated.data;
    }

    /**
     * Deterministic fallback if LLM is offline or times out
     */
    private generateDeterministicFallbackReplan(
        contextPayload: any,
        delayedTasks: any[],
        blockedTasks: any[]
    ): AdaptiveReplanResult {
        const hasDelays = delayedTasks.length > 0;
        const hasBlockers = blockedTasks.length > 0;
        const variance = contextPayload.timeTracking.varianceMinutes;

        const riskLevel =
            variance > 120 || blockedTasks.length >= 3
                ? "HIGH"
                : variance > 0 || hasBlockers
                ? "MEDIUM"
                : "LOW";

        const factors: string[] = [];
        if (hasDelays) {
            factors.push(
                `${delayedTasks.length} task(s) exceeded original estimates by ${Math.max(0, variance)} minutes.`
            );
        }
        if (hasBlockers) {
            factors.push(`${blockedTasks.length} task(s) are currently blocked waiting on dependencies.`);
        }
        if (factors.length === 0) {
            factors.push("Project execution is tracking on schedule.");
        }

        // Generate heuristic suggestions for incomplete tasks
        const suggestions: any[] = [];
        for (const t of contextPayload.incompleteTasks) {
            const isDelayed = delayedTasks.some((d) => d.id === t.id);
            const isBlocked = blockedTasks.some((b) => b.id === t.id);

            if (isDelayed) {
                suggestions.push({
                    taskId: t.id,
                    taskTitle: t.title,
                    action: "ADJUST_ESTIMATE",
                    reason: `Task actual time exceeded original estimate. Adjusting allocated duration to prevent downstream slippage.`,
                    suggestedEstimatedMinutes: Math.round((t.actualMinutes || t.estimatedMinutes) * 1.2),
                });
            } else if (isBlocked) {
                suggestions.push({
                    taskId: t.id,
                    taskTitle: t.title,
                    action: "CHANGE_PRIORITY",
                    reason: `Task is blocked by unfinished prerequisite tasks. Temporarily lower priority until unblocked.`,
                    suggestedPriority: t.priority === "URGENT" ? "HIGH" : "MEDIUM",
                });
            } else if (variance > 60 && t.priority === "LOW") {
                suggestions.push({
                    taskId: t.id,
                    taskTitle: t.title,
                    action: "RESCHEDULE",
                    reason: `Project is experiencing overall delay. Postpone lower priority work to secure critical deliverables.`,
                    suggestedPriority: "LOW",
                });
            }
        }

        return {
            currentSituation: {
                summary: `Project is ${contextPayload.project.progressPercentage}% complete. ${contextPayload.project.completedCount} of ${contextPayload.project.totalTasks} tasks done.`,
                progressPercentage: contextPayload.project.progressPercentage,
                totalTasks: contextPayload.project.totalTasks,
                completedTasks: contextPayload.project.completedCount,
                delayedTasksCount: delayedTasks.length,
                blockedTasksCount: blockedTasks.length,
                totalEstimatedMinutes: contextPayload.timeTracking.totalEstimatedMinutes,
                totalActualMinutes: contextPayload.timeTracking.totalActualMinutes,
                varianceMinutes: variance,
            },
            risk: {
                level: riskLevel,
                summary:
                    riskLevel === "HIGH"
                        ? "Significant delivery delay detected due to task overruns and dependency bottlenecks."
                        : riskLevel === "MEDIUM"
                        ? "Moderate variance observed. Rebalancing priorities is recommended."
                        : "Low risk. Project is on track with current estimates.",
                factors,
            },
            delayedTasks: delayedTasks.map((d) => ({
                id: d.id,
                title: d.title,
                estimatedMinutes: d.estimatedMinutes,
                actualMinutes: d.actualMinutes,
                overrunMinutes: d.overrunMinutes,
                priority: d.priority,
            })),
            blockedTasks: blockedTasks.map((b) => ({
                id: b.id,
                title: b.title,
                priority: b.priority,
                blockedBy: b.blockedBy,
            })),
            suggestedChanges: suggestions,
            revisedPlanSummary:
                "Proposed rebalanced plan adjusting task estimates and re-sequencing blocked tasks to protect project deadline.",
        };
    }

    /**
     * Applies approved adaptive replan suggestions in PostgreSQL using a Prisma transaction.
     */
    async applyAdaptiveReplanChanges(
        projectId: string,
        userId: string,
        input: ApplyAdaptiveReplanInput
    ) {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project) {
            return { error: "Project not found." };
        }

        const membership = await getWorkspaceMembership(project.workspaceId, userId);
        if (!membership) {
            return { error: "You do not have access to this project." };
        }

        const updatedTasks = await prisma.$transaction(async (tx) => {
            const results = [];
            for (const change of input.changes) {
                // Verify task belongs to this project
                const task = await tx.task.findFirst({
                    where: { id: change.taskId, projectId },
                });
                if (!task) continue;

                const updateData: Record<string, any> = {};
                if (change.priority) updateData.priority = change.priority;
                if (change.estimatedMinutes) updateData.estimatedMinutes = change.estimatedMinutes;
                if (change.dueDate !== undefined) {
                    updateData.dueDate = change.dueDate ? new Date(change.dueDate) : null;
                }
                if (change.milestoneId !== undefined) {
                    updateData.milestoneId = change.milestoneId;
                }

                if (Object.keys(updateData).length > 0) {
                    const updated = await tx.task.update({
                        where: { id: change.taskId },
                        data: updateData,
                    });
                    results.push(updated);
                }
            }
            return results;
        });

        return { success: true, updatedCount: updatedTasks.length };
    }
}

// Default application-wide AI service instance
export const aiService = new AIService();
