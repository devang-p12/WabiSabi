import { z } from "zod";

export const aiHealthResponseSchema = z.object({
    healthy: z.boolean(),
    provider: z.string(),
    model: z.string(),
    baseUrl: z.string(),
    message: z.string(),
    availableModels: z.array(z.string()).optional(),
    responseTimeMs: z.number().optional(),
});

export const aiTestPromptSchema = z.object({
    prompt: z.string().min(1, "Prompt cannot be empty").max(1000, "Prompt is too long"),
    systemPrompt: z.string().max(2000).optional(),
    temperature: z.number().min(0).max(2).optional(),
});

export const analyzeProjectInputSchema = z.object({
    input: z
        .string()
        .min(3, "Project description or prompt must be at least 3 characters")
        .max(5000, "Project description is too long (maximum 5000 characters)"),
});

export const taskPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
export type TaskPriority = z.infer<typeof taskPriorityEnum>;

export const analyzedTaskSchema = z.object({
    title: z.string().min(1, "Task title is required"),
    description: z.string().optional().default(""),
    priority: z.preprocess((val) => {
        if (typeof val === "string") {
            const upper = val.toUpperCase().trim();
            if (["LOW", "MEDIUM", "HIGH", "URGENT"].includes(upper)) {
                return upper;
            }
        }
        return "MEDIUM";
    }, taskPriorityEnum),
    estimatedMinutes: z.preprocess((val) => {
        if (typeof val === "number" && !Number.isNaN(val)) {
            return Math.max(5, Math.round(val));
        }
        if (typeof val === "string") {
            const match = val.match(/\d+/);
            if (match) {
                const parsed = parseInt(match[0], 10);
                if (!Number.isNaN(parsed) && parsed > 0) return parsed;
            }
        }
        return 60;
    }, z.number().int().positive().default(60)),
    dependencies: z.preprocess((val) => {
        if (Array.isArray(val)) {
            return val
                .map((item) => (typeof item === "string" ? item.trim() : ""))
                .filter(Boolean);
        }
        return [];
    }, z.array(z.string()).default([])),
});

export const analyzedMilestoneSchema = z.object({
    title: z.string().min(1, "Milestone title is required"),
    description: z.string().optional().default(""),
    tasks: z
        .array(analyzedTaskSchema)
        .min(1, "Each milestone must contain at least one task"),
});

export const analyzedProjectPlanSchema = z.object({
    name: z.string().min(1, "Project name is required"),
    goal: z.string().min(1, "Project goal is required"),
    milestones: z
        .array(analyzedMilestoneSchema)
        .min(1, "At least one milestone is required"),
    totalEstimatedMinutes: z.number().int().nonnegative().optional(),
});

export const applyProjectPlanSchema = z.object({
    workspaceId: z.string().uuid("Invalid workspace ID"),
    boardId: z.string().uuid("Invalid board ID").optional(),
    plan: analyzedProjectPlanSchema,
});

// ==========================================
// Phase 9: Adaptive Replan Schemas
// ==========================================

export const taskReplanSuggestionSchema = z.object({
    taskId: z.string().min(1, "Task ID is required"),
    taskTitle: z.string(),
    action: z.enum([
        "KEEP",
        "CHANGE_PRIORITY",
        "ADJUST_ESTIMATE",
        "RESCHEDULE",
        "MOVE_MILESTONE",
        "SPLIT_TASK",
    ]),
    reason: z.string(),
    suggestedPriority: taskPriorityEnum.optional(),
    suggestedEstimatedMinutes: z.number().int().positive().optional(),
    suggestedDueDate: z.string().optional(), // YYYY-MM-DD or ISO
    suggestedMilestoneId: z.string().optional(),
});

export const adaptiveReplanResultSchema = z.object({
    currentSituation: z.object({
        summary: z.string(),
        progressPercentage: z.number(),
        totalTasks: z.number(),
        completedTasks: z.number(),
        delayedTasksCount: z.number(),
        blockedTasksCount: z.number(),
        totalEstimatedMinutes: z.number(),
        totalActualMinutes: z.number(),
        varianceMinutes: z.number(), // actual - estimated (positive = behind)
    }),
    risk: z.object({
        level: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
        summary: z.string(),
        factors: z.array(z.string()),
    }),
    delayedTasks: z.array(
        z.object({
            id: z.string(),
            title: z.string(),
            estimatedMinutes: z.number(),
            actualMinutes: z.number(),
            overrunMinutes: z.number(),
            priority: taskPriorityEnum,
        })
    ),
    blockedTasks: z.array(
        z.object({
            id: z.string(),
            title: z.string(),
            priority: taskPriorityEnum,
            blockedBy: z.array(z.string()),
        })
    ),
    suggestedChanges: z.array(taskReplanSuggestionSchema),
    revisedPlanSummary: z.string(),
});

export const applyAdaptiveReplanSchema = z.object({
    projectId: z.string().uuid("Invalid project ID"),
    changes: z.array(
        z.object({
            taskId: z.string().uuid("Invalid task ID"),
            priority: taskPriorityEnum.optional(),
            estimatedMinutes: z.number().int().positive().optional(),
            dueDate: z.string().nullable().optional(),
            milestoneId: z.string().uuid().nullable().optional(),
        })
    ).min(1, "At least one change must be selected to apply"),
});

export type AIHealthResponse = z.infer<typeof aiHealthResponseSchema>;
export type AITestPromptInput = z.infer<typeof aiTestPromptSchema>;
export type AnalyzeProjectInput = z.infer<typeof analyzeProjectInputSchema>;
export type AnalyzedTask = z.infer<typeof analyzedTaskSchema>;
export type AnalyzedMilestone = z.infer<typeof analyzedMilestoneSchema>;
export type AnalyzedProjectPlan = z.infer<typeof analyzedProjectPlanSchema>;
export type ApplyProjectPlanInput = z.infer<typeof applyProjectPlanSchema>;

export type TaskReplanSuggestion = z.infer<typeof taskReplanSuggestionSchema>;
export type AdaptiveReplanResult = z.infer<typeof adaptiveReplanResultSchema>;
export type ApplyAdaptiveReplanInput = z.infer<typeof applyAdaptiveReplanSchema>;
