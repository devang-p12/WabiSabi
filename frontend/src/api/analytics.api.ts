import { api } from "./client";

export interface WorkspaceAnalyticsData {
    workspace: {
        id: string;
        name: string;
    };
    filter: {
        boardId: string | null;
        boardName: string | null;
        timeframe: "7d" | "14d" | "30d";
    };
    overview: {
        totalTasks: number;
        completedTasks: number;
        inProgressTasks: number;
        todoTasks: number;
        overdueTasks: number;
        dueSoonTasks: number;
        completionRate: number; // 0 - 100
        totalSubtasks: number;
        completedSubtasks: number;
        subtaskCompletionRate: number; // 0 - 100
        activeMembersCount: number;
    };
    priorityBreakdown: {
        LOW: { count: number; percentage: number };
        MEDIUM: { count: number; percentage: number };
        HIGH: { count: number; percentage: number };
        URGENT: { count: number; percentage: number };
    };
    stagesBreakdown: Array<{
        listId: string;
        listName: string;
        boardId: string;
        boardName: string;
        taskCount: number;
        percentage: number;
    }>;
    workloadDistribution: Array<{
        userId: string | null;
        name: string;
        email?: string;
        avatarUrl?: string | null;
        role?: string;
        totalAssigned: number;
        completed: number;
        inProgress: number;
        overdue: number;
        completionRate: number;
        workloadLevel: "Available" | "Optimal" | "Moderate" | "Heavy";
    }>;
    dailyTrends: Array<{
        date: string; // YYYY-MM-DD
        dayLabel: string; // Mon, Tue, etc.
        created: number;
        completed: number;
        activities: number;
    }>;
    recentCompletions: Array<{
        id: string;
        title: string;
        completedAt: string;
        priority: string;
        boardName: string;
        assignee?: {
            id: string;
            name: string;
            avatarUrl: string | null;
        } | null;
    }>;
}

export interface AnalyticsQueryOptions {
    boardId?: string;
    timeframe?: "7d" | "14d" | "30d";
}

export const getWorkspaceAnalytics = async (
    workspaceId: string,
    options: AnalyticsQueryOptions = {}
): Promise<WorkspaceAnalyticsData> => {
    const params = new URLSearchParams();
    if (options.boardId) params.append("boardId", options.boardId);
    if (options.timeframe) params.append("timeframe", options.timeframe);

    const qs = params.toString() ? `?${params.toString()}` : "";
    const res = await api.get<{ success: boolean; data: WorkspaceAnalyticsData }>(
        `/workspaces/${workspaceId}/analytics${qs}`
    );
    return res.data.data;
};

export const getBoardAnalytics = async (
    boardId: string,
    options: { timeframe?: "7d" | "14d" | "30d" } = {}
): Promise<WorkspaceAnalyticsData> => {
    const params = new URLSearchParams();
    if (options.timeframe) params.append("timeframe", options.timeframe);

    const qs = params.toString() ? `?${params.toString()}` : "";
    const res = await api.get<{ success: boolean; data: WorkspaceAnalyticsData }>(
        `/boards/${boardId}/analytics${qs}`
    );
    return res.data.data;
};
