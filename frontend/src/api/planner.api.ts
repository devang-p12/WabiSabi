import { api } from "./client";
import type { TaskPriority } from "./task.api";

export interface PlannedTaskItem {
    id: string;
    title: string;
    description: string | null;
    priority: TaskPriority;
    dueDate: string | null;
    completed: boolean;
    coverUrl: string | null;
    estimatedMinutes: number | null;
    effectiveMinutes: number;
    actualMinutes: number | null;
    startedAt: string | null;
    completedAt: string | null;
    listId: string;
    listName?: string | undefined;
    boardId?: string | undefined;
    boardName?: string | undefined;
    workspaceId?: string | undefined;
    projectId?: string | null | undefined;
    projectName?: string | null | undefined;
    milestoneId?: string | null | undefined;
    milestoneTitle?: string | null | undefined;
    assignee?: {
        id: string;
        name: string;
        email: string;
        avatarUrl: string | null;
    } | null;
    isBlocked: boolean;
    blockingDependencies: Array<{
        id: string;
        title: string;
        completed: boolean;
    }>;
    score: number;
    primaryReason: string;
    reasons: string[];
}

export interface TodayPlanResult {
    date: string;
    availableMinutes: number;
    plannedMinutes: number;
    completedMinutes: number;
    plannedTimeFormatted: string;
    availableTimeFormatted: string;
    completedTimeFormatted: string;
    summary: {
        totalPlanned: number;
        totalBlocked: number;
        totalOverflow: number;
        totalCompletedToday: number;
    };
    sections: {
        next: PlannedTaskItem | null;
        upNext: PlannedTaskItem[];
        later: PlannedTaskItem[];
        blocked: PlannedTaskItem[];
        overflow: PlannedTaskItem[];
        completedToday: PlannedTaskItem[];
    };
}

export const getTodayPlan = async (params?: {
    workspaceId?: string | undefined;
    availableMinutes?: number | undefined;
    projectId?: string | undefined;
    date?: string | undefined;
}): Promise<TodayPlanResult> => {
    const response = await api.get("/planner/today", { params });
    return response.data.data;
};
