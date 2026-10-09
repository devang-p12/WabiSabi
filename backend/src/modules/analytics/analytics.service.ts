import { prisma } from "../../config/prisma.js";

export interface AnalyticsFilters {
    boardId?: string | undefined;
    timeframe?: "7d" | "14d" | "30d" | undefined;
}

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

const DONE_REGEX = /(done|completed|finished|closed|released|shipped)/i;
const IN_PROGRESS_REGEX = /(in progress|doing|ongoing|wip|active|in-progress|review|testing)/i;

export const getWorkspaceAnalyticsService = async (
    workspaceId: string,
    userId: string,
    filters: AnalyticsFilters = {}
): Promise<WorkspaceAnalyticsData> => {
    // 1. Verify user membership in workspace
    const membership = await prisma.workspaceMember.findUnique({
        where: {
            workspaceId_userId: {
                workspaceId,
                userId,
            },
        },
        include: {
            workspace: {
                select: { id: true, name: true },
            },
        },
    });

    if (!membership) {
        throw new Error("Forbidden: You are not a member of this workspace");
    }

    // 2. Fetch boards within the workspace
    const boards = await prisma.board.findMany({
        where: {
            workspaceId,
            ...(filters.boardId ? { id: filters.boardId } : {}),
        },
        select: {
            id: true,
            name: true,
        },
    });

    const boardIds = boards.map((b) => b.id);
    const selectedBoard = filters.boardId ? boards.find((b) => b.id === filters.boardId) : null;

    // 3. Fetch workspace members
    const members = await prisma.workspaceMember.findMany({
        where: { workspaceId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                },
            },
        },
    });

    // 4. Fetch tasks in scope
    const tasks = boardIds.length > 0 ? await prisma.task.findMany({
        where: {
            list: {
                boardId: { in: boardIds },
            },
        },
        include: {
            list: {
                select: {
                    id: true,
                    name: true,
                    boardId: true,
                    position: true,
                    board: {
                        select: { name: true },
                    },
                },
            },
            assignee: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                },
            },
            subtasks: {
                select: {
                    id: true,
                    completed: true,
                },
            },
        },
    }) : [];

    // 5. Timeframe for trends
    const daysCount = filters.timeframe === "30d" ? 30 : filters.timeframe === "14d" ? 14 : 7;
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - (daysCount - 1));
    sinceDate.setHours(0, 0, 0, 0);

    // Fetch activity logs in the timeframe
    const activityLogs = boardIds.length > 0 ? await prisma.activityLog.findMany({
        where: {
            boardId: { in: boardIds },
            createdAt: { gte: sinceDate },
        },
        orderBy: { createdAt: "desc" },
    }) : [];

    // 6. Compute Overview Metrics
    const now = Date.now();
    const fortyEightHoursFromNow = now + 48 * 60 * 60 * 1000;

    let completedTasks = 0;
    let inProgressTasks = 0;
    let todoTasks = 0;
    let overdueTasks = 0;
    let dueSoonTasks = 0;
    let totalSubtasks = 0;
    let completedSubtasks = 0;

    const priorityCounts = {
        LOW: 0,
        MEDIUM: 0,
        HIGH: 0,
        URGENT: 0,
    };

    const stageMap = new Map<string, {
        listId: string;
        listName: string;
        boardId: string;
        boardName: string;
        taskCount: number;
    }>();

    // Workload tracking per userId
    const memberWorkloadMap = new Map<string, {
        total: number;
        completed: number;
        inProgress: number;
        overdue: number;
    }>();

    // Initialize all workspace members in workload map
    members.forEach((m) => {
        memberWorkloadMap.set(m.userId, {
            total: 0,
            completed: 0,
            inProgress: 0,
            overdue: 0,
        });
    });

    let unassignedWorkload = {
        total: 0,
        completed: 0,
        inProgress: 0,
        overdue: 0,
    };

    tasks.forEach((task) => {
        // Priority
        if (task.priority in priorityCounts) {
            priorityCounts[task.priority]++;
        }

        // Subtasks
        totalSubtasks += task.subtasks.length;
        completedSubtasks += task.subtasks.filter((s) => s.completed).length;

        // Completion status
        const isDoneByList = DONE_REGEX.test(task.list.name);
        const isDone = task.completed || isDoneByList;
        const isInProgress = !isDone && IN_PROGRESS_REGEX.test(task.list.name);

        if (isDone) {
            completedTasks++;
        } else if (isInProgress) {
            inProgressTasks++;
        } else {
            todoTasks++;
        }

        // Due date status
        if (task.dueDate && !isDone) {
            const dueTime = new Date(task.dueDate).getTime();
            if (dueTime < now) {
                overdueTasks++;
            } else if (dueTime <= fortyEightHoursFromNow) {
                dueSoonTasks++;
            }
        }

        // Stages breakdown
        const listKey = task.list.id;
        const existingStage = stageMap.get(listKey);
        if (existingStage) {
            existingStage.taskCount++;
        } else {
            stageMap.set(listKey, {
                listId: task.list.id,
                listName: task.list.name,
                boardId: task.list.boardId,
                boardName: task.list.board?.name || "Board",
                taskCount: 1,
            });
        }

        // Workload distribution
        if (task.assigneeId && memberWorkloadMap.has(task.assigneeId)) {
            const stats = memberWorkloadMap.get(task.assigneeId)!;
            stats.total++;
            if (isDone) stats.completed++;
            else if (isInProgress) stats.inProgress++;
            if (task.dueDate && !isDone && new Date(task.dueDate).getTime() < now) {
                stats.overdue++;
            }
        } else {
            unassignedWorkload.total++;
            if (isDone) unassignedWorkload.completed++;
            else if (isInProgress) unassignedWorkload.inProgress++;
            if (task.dueDate && !isDone && new Date(task.dueDate).getTime() < now) {
                unassignedWorkload.overdue++;
            }
        }
    });

    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const subtaskCompletionRate = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

    // Priority percentages
    const priorityBreakdown = {
        LOW: {
            count: priorityCounts.LOW,
            percentage: totalTasks > 0 ? Math.round((priorityCounts.LOW / totalTasks) * 100) : 0,
        },
        MEDIUM: {
            count: priorityCounts.MEDIUM,
            percentage: totalTasks > 0 ? Math.round((priorityCounts.MEDIUM / totalTasks) * 100) : 0,
        },
        HIGH: {
            count: priorityCounts.HIGH,
            percentage: totalTasks > 0 ? Math.round((priorityCounts.HIGH / totalTasks) * 100) : 0,
        },
        URGENT: {
            count: priorityCounts.URGENT,
            percentage: totalTasks > 0 ? Math.round((priorityCounts.URGENT / totalTasks) * 100) : 0,
        },
    };

    // Stages / Lists
    const stagesBreakdown = Array.from(stageMap.values())
        .sort((a, b) => b.taskCount - a.taskCount)
        .map((stage) => ({
            ...stage,
            percentage: totalTasks > 0 ? Math.round((stage.taskCount / totalTasks) * 100) : 0,
        }));

    // Member Workload Array
    const workloadDistribution: WorkspaceAnalyticsData["workloadDistribution"] = members.map((m) => {
        const stats = memberWorkloadMap.get(m.userId) || { total: 0, completed: 0, inProgress: 0, overdue: 0 };
        const memberCompletionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

        let workloadLevel: "Available" | "Optimal" | "Moderate" | "Heavy" = "Available";
        const active = stats.total - stats.completed;
        if (active === 0) workloadLevel = "Available";
        else if (active <= 3) workloadLevel = "Optimal";
        else if (active <= 7) workloadLevel = "Moderate";
        else workloadLevel = "Heavy";

        return {
            userId: m.userId,
            name: m.user.name,
            email: m.user.email,
            avatarUrl: m.user.avatarUrl,
            role: m.role,
            totalAssigned: stats.total,
            completed: stats.completed,
            inProgress: stats.inProgress,
            overdue: stats.overdue,
            completionRate: memberCompletionRate,
            workloadLevel,
        };
    }).sort((a, b) => b.totalAssigned - a.totalAssigned);

    // Add unassigned if present
    if (unassignedWorkload.total > 0) {
        workloadDistribution.push({
            userId: null,
            name: "Unassigned Tasks",
            totalAssigned: unassignedWorkload.total,
            completed: unassignedWorkload.completed,
            inProgress: unassignedWorkload.inProgress,
            overdue: unassignedWorkload.overdue,
            completionRate: unassignedWorkload.total > 0 ? Math.round((unassignedWorkload.completed / unassignedWorkload.total) * 100) : 0,
            workloadLevel: "Moderate",
        });
    }

    // 7. Daily Trends & Velocity
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dailyTrends: WorkspaceAnalyticsData["dailyTrends"] = [];

    for (let i = 0; i < daysCount; i++) {
        const d = new Date(sinceDate);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split("T")[0] || "";
        const dayLabel = dayLabels[d.getDay()] || "";

        // Tasks created on this day
        const createdOnDay = tasks.filter((t) => {
            const taskCreatedDate = new Date(t.createdAt).toISOString().split("T")[0];
            return taskCreatedDate === dateStr;
        }).length;

        // Tasks completed on this day (either task updatedAt on this day if completed, or logged activity)
        const completedOnDay = tasks.filter((t) => {
            const isDone = t.completed || DONE_REGEX.test(t.list.name);
            if (!isDone) return false;
            const updatedDate = new Date(t.updatedAt).toISOString().split("T")[0];
            return updatedDate === dateStr;
        }).length;

        // Activity log count on this day
        const activitiesOnDay = activityLogs.filter((log) => {
            const logDate = new Date(log.createdAt).toISOString().split("T")[0];
            return logDate === dateStr;
        }).length;

        dailyTrends.push({
            date: dateStr,
            dayLabel,
            created: createdOnDay,
            completed: completedOnDay,
            activities: activitiesOnDay,
        });
    }

    // 8. Recent Completions
    const completedTasksList = tasks
        .filter((t) => t.completed || DONE_REGEX.test(t.list.name))
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5)
        .map((t) => ({
            id: t.id,
            title: t.title,
            completedAt: t.updatedAt.toISOString(),
            priority: t.priority,
            boardName: t.list.board?.name || "Board",
            assignee: t.assignee ? {
                id: t.assignee.id,
                name: t.assignee.name,
                avatarUrl: t.assignee.avatarUrl,
            } : null,
        }));

    return {
        workspace: {
            id: membership.workspace.id,
            name: membership.workspace.name,
        },
        filter: {
            boardId: selectedBoard?.id ?? null,
            boardName: selectedBoard?.name ?? null,
            timeframe: (filters.timeframe as "7d" | "14d" | "30d") || "7d",
        },
        overview: {
            totalTasks,
            completedTasks,
            inProgressTasks,
            todoTasks,
            overdueTasks,
            dueSoonTasks,
            completionRate,
            totalSubtasks,
            completedSubtasks,
            subtaskCompletionRate,
            activeMembersCount: members.length,
        },
        priorityBreakdown,
        stagesBreakdown,
        workloadDistribution,
        dailyTrends,
        recentCompletions: completedTasksList,
    };
};
