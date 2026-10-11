import { api } from "./client";
import type { Project } from "./project.api";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface AnalyzedTask {
    title: string;
    description?: string;
    priority: TaskPriority;
    estimatedMinutes: number;
    dependencies: string[];
}

export interface AnalyzedMilestone {
    title: string;
    description?: string;
    tasks: AnalyzedTask[];
}

export interface AnalyzedProjectPlan {
    name: string;
    goal: string;
    milestones: AnalyzedMilestone[];
    totalEstimatedMinutes?: number;
}

export interface AIHealthStatus {
    healthy: boolean;
    provider: string;
    model: string;
    baseUrl: string;
    message: string;
    availableModels?: string[];
    responseTimeMs?: number;
}

export interface AnalyzeProjectRequest {
    input: string;
}

export interface CreateProjectFromPlanRequest {
    workspaceId: string;
    boardId?: string;
    plan: AnalyzedProjectPlan;
}

/**
 * Checks AI health and Ollama connectivity
 */
export const checkAIHealth = async (): Promise<AIHealthStatus> => {
    const res = await api.get<{ success: boolean; data: AIHealthStatus }>(
        "/ai/health"
    );
    return res.data.data;
};

/**
 * Analyzes informal project requirements into a structured roadmap plan
 */
export const analyzeProjectPlan = async (
    input: string
): Promise<AnalyzedProjectPlan> => {
    const res = await api.post<{ success: boolean; data: AnalyzedProjectPlan }>(
        "/ai/projects/analyze",
        { input },
        { timeout: 180000 }
    );
    return res.data.data;
};

/**
 * Creates Project, Milestones, Tasks, and Dependencies atomically after user approval
 */
export const createProjectFromApprovedPlan = async (
    workspaceId: string,
    plan: AnalyzedProjectPlan,
    boardId?: string
): Promise<Project> => {
    const res = await api.post<{ success: boolean; data: Project }>(
        "/ai/projects/create-from-plan",
        {
            workspaceId,
            plan,
            ...(boardId ? { boardId } : {}),
        }
    );
    return res.data.data;
};

// ==========================================
// Phase 9: Adaptive Replan Frontend Types
// ==========================================

export interface TaskReplanSuggestion {
    taskId: string;
    taskTitle: string;
    action:
        | "KEEP"
        | "CHANGE_PRIORITY"
        | "ADJUST_ESTIMATE"
        | "RESCHEDULE"
        | "MOVE_MILESTONE"
        | "SPLIT_TASK";
    reason: string;
    suggestedPriority?: TaskPriority;
    suggestedEstimatedMinutes?: number;
    suggestedDueDate?: string;
    suggestedMilestoneId?: string;
}

export interface DelayedTaskSummary {
    id: string;
    title: string;
    estimatedMinutes: number;
    actualMinutes: number;
    overrunMinutes: number;
    priority: TaskPriority;
}

export interface BlockedTaskSummary {
    id: string;
    title: string;
    priority: TaskPriority;
    blockedBy: string[];
}

export interface AdaptiveReplanResult {
    currentSituation: {
        summary: string;
        progressPercentage: number;
        totalTasks: number;
        completedTasks: number;
        delayedTasksCount: number;
        blockedTasksCount: number;
        totalEstimatedMinutes: number;
        totalActualMinutes: number;
        varianceMinutes: number;
    };
    risk: {
        level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
        summary: string;
        factors: string[];
    };
    delayedTasks: DelayedTaskSummary[];
    blockedTasks: BlockedTaskSummary[];
    suggestedChanges: TaskReplanSuggestion[];
    revisedPlanSummary: string;
}

export interface ApplyAdaptiveReplanItem {
    taskId: string;
    priority?: TaskPriority;
    estimatedMinutes?: number;
    dueDate?: string | null;
    milestoneId?: string | null;
}

/**
 * Generates an AI-assisted adaptive replan for a project
 */
export const generateAdaptiveReplan = async (
    projectId: string
): Promise<AdaptiveReplanResult> => {
    const res = await api.post<{ success: boolean; data: AdaptiveReplanResult }>(
        `/ai/projects/${projectId}/replan`,
        {},
        { timeout: 180000 }
    );
    return res.data.data;
};

/**
 * Applies selected adaptive replan changes
 */
export const applyAdaptiveReplan = async (
    projectId: string,
    changes: ApplyAdaptiveReplanItem[]
): Promise<{ success: boolean; updatedCount: number }> => {
    const res = await api.post<{
        success: boolean;
        data: { success: boolean; updatedCount: number };
    }>(`/ai/projects/${projectId}/replan/apply`, {
        projectId,
        changes,
    });
    return res.data.data;
};

// ==========================================
// Phase 13: Tool Orchestration Frontend Types
// ==========================================

export interface ToolExecutionRecord {
    toolName: string;
    params: any;
    result?: any;
    error?: string;
    durationMs: number;
}

export interface OrchestrationResult {
    thought?: string;
    toolUsed?: string;
    toolInput?: any;
    toolOutput?: any;
    response: string;
    executionHistory: ToolExecutionRecord[];
}

export interface AIToolInfo {
    name: string;
    description: string;
}

/**
 * Sends a natural language prompt to the AI tool orchestrator
 */
export const orchestratePrompt = async (
    workspaceId: string,
    prompt: string,
    projectId?: string
): Promise<OrchestrationResult> => {
    const res = await api.post<{ success: boolean; data: OrchestrationResult }>(
        `/ai/workspaces/${workspaceId}/orchestrate`,
        {
            prompt,
            ...(projectId ? { projectId } : {}),
        },
        { timeout: 90000 }
    );
    return res.data.data;
};

/**
 * Fetch available tools description
 */
export const getAvailableTools = async (): Promise<AIToolInfo[]> => {
    const res = await api.get<{ success: boolean; data: AIToolInfo[] }>("/ai/tools");
    return res.data.data;
};

