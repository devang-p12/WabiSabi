import { prisma } from "../../config/prisma.js";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface PlannerQueryOptions {
    userId: string;
    workspaceId?: string | undefined;
    projectId?: string | undefined;
    availableMinutes?: number | undefined; // Default: 480
    date?: string | undefined; // ISO string or YYYY-MM-DD
}

export interface PlannedTaskItem {
    id: string;
    title: string;
    description: string | null;
    priority: TaskPriority;
    dueDate: Date | null;
    completed: boolean;
    coverUrl: string | null;
    estimatedMinutes: number | null;
    effectiveMinutes: number; // estimatedMinutes || 30
    actualMinutes: number | null;
    startedAt: Date | null;
    completedAt: Date | null;
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
    plannedTimeFormatted: string; // e.g. "2h 15m"
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

const formatMinutes = (mins: number): string => {
    if (mins <= 0) return "0 min";
    const hrs = Math.floor(mins / 60);
    const remaining = mins % 60;
    if (hrs === 0) return `${remaining}m`;
    if (remaining === 0) return `${hrs}h`;
    return `${hrs}h ${remaining}m`;
};

const priorityWeight: Record<TaskPriority, number> = {
    URGENT: 400,
    HIGH: 300,
    MEDIUM: 200,
    LOW: 100,
};

export const getTodayPlan = async (
    options: PlannerQueryOptions
): Promise<TodayPlanResult> => {
    const { userId, workspaceId, projectId } = options;
    const availableMinutes = options.availableMinutes && options.availableMinutes > 0
        ? Math.min(options.availableMinutes, 1440)
        : 480; // default 8 hours

    const now = options.date ? new Date(options.date) : new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const in3Days = new Date(startOfToday.getTime() + 3 * 24 * 60 * 60 * 1000);

    // 1. Determine workspaces accessible to user
    let allowedWorkspaceIds: string[] = [];
    if (workspaceId) {
        const member = await prisma.workspaceMember.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId,
                },
            },
        });
        if (!member) {
            throw new Error("You are not a member of this workspace.");
        }
        allowedWorkspaceIds = [workspaceId];
    } else {
        const memberships = await prisma.workspaceMember.findMany({
            where: { userId },
            select: { workspaceId: true },
        });
        allowedWorkspaceIds = memberships.map((m) => m.workspaceId);
    }

    if (allowedWorkspaceIds.length === 0) {
        return {
            date: startOfToday.toISOString().slice(0, 10),
            availableMinutes,
            plannedMinutes: 0,
            completedMinutes: 0,
            plannedTimeFormatted: "0m planned",
            availableTimeFormatted: formatMinutes(availableMinutes),
            completedTimeFormatted: "0m",
            summary: {
                totalPlanned: 0,
                totalBlocked: 0,
                totalOverflow: 0,
                totalCompletedToday: 0,
            },
            sections: {
                next: null,
                upNext: [],
                later: [],
                blocked: [],
                overflow: [],
                completedToday: [],
            },
        };
    }

    // 2. Fetch incomplete tasks in scope
    const incompleteTasks = await prisma.task.findMany({
        where: {
            completed: false,
            list: {
                board: {
                    workspaceId: { in: allowedWorkspaceIds },
                },
            },
            ...(projectId ? { projectId } : {}),
        },
        include: {
            list: {
                select: {
                    id: true,
                    name: true,
                    boardId: true,
                    board: {
                        select: {
                            id: true,
                            name: true,
                            workspaceId: true,
                        },
                    },
                },
            },
            project: {
                select: {
                    id: true,
                    name: true,
                },
            },
            milestone: {
                select: {
                    id: true,
                    title: true,
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
            dependencies: {
                include: {
                    dependsOn: {
                        select: {
                            id: true,
                            title: true,
                            completed: true,
                            priority: true,
                        },
                    },
                },
            },
        },
    });

    // 3. Fetch tasks completed today for accomplishments section
    const completedTodayTasks = await prisma.task.findMany({
        where: {
            completed: true,
            completedAt: {
                gte: startOfToday,
                lte: endOfToday,
            },
            list: {
                board: {
                    workspaceId: { in: allowedWorkspaceIds },
                },
            },
            ...(projectId ? { projectId } : {}),
        },
        include: {
            list: {
                select: {
                    id: true,
                    name: true,
                    board: {
                        select: {
                            id: true,
                            name: true,
                            workspaceId: true,
                        },
                    },
                },
            },
            project: {
                select: {
                    id: true,
                    name: true,
                },
            },
            assignee: {
                select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                },
            },
        },
        orderBy: {
            completedAt: "desc",
        },
    });

    // 4. Transform and evaluate each incomplete task
    const evaluatedTasks: PlannedTaskItem[] = incompleteTasks.map((t) => {
        // Evaluate dependencies
        const blockingDeps = t.dependencies
            .filter((dep) => !dep.dependsOn.completed)
            .map((dep) => ({
                id: dep.dependsOn.id,
                title: dep.dependsOn.title,
                completed: dep.dependsOn.completed,
            }));

        const isBlocked = blockingDeps.length > 0;

        // Effective estimated minutes (fallback: 30 minutes if unspecified)
        const effectiveMinutes =
            t.estimatedMinutes !== null && t.estimatedMinutes !== undefined && t.estimatedMinutes > 0
                ? t.estimatedMinutes
                : 30;

        // Calculate score & reasons
        let score = 0;
        const reasons: string[] = [];

        // Factor 1: Unblocked preference
        if (!isBlocked) {
            score += 2000;
        } else {
            score -= 10000;
            const blockerTitles = blockingDeps.map((b) => b.title).slice(0, 2).join(", ");
            reasons.push(`Blocked by prerequisite: ${blockerTitles}`);
        }

        // Factor 2: Due date urgency
        if (t.dueDate) {
            const due = new Date(t.dueDate);
            if (due < startOfToday) {
                score += 1500;
                reasons.push("Overdue");
            } else if (due <= endOfToday) {
                score += 1000;
                reasons.push("Due today");
            } else if (due <= in3Days) {
                score += 500;
                reasons.push("Due soon");
            }
        }

        // Factor 3: Priority
        score += priorityWeight[t.priority] || 200;
        if (t.priority === "URGENT" || t.priority === "HIGH") {
            reasons.push(`${t.priority.charAt(0) + t.priority.slice(1).toLowerCase()} priority`);
        }

        // Factor 4: Already in progress
        if (t.startedAt) {
            score += 150;
            reasons.push("In progress");
        }

        // Factor 5: Project alignment
        if (t.projectId && t.project?.name) {
            score += 50;
            reasons.push(`Project: ${t.project.name}`);
        }

        const primaryReason =
            reasons.length > 0 ? reasons.join(" • ") : "Scheduled task";

        return {
            id: t.id,
            title: t.title,
            description: t.description,
            priority: t.priority,
            dueDate: t.dueDate,
            completed: t.completed,
            coverUrl: t.coverUrl,
            estimatedMinutes: t.estimatedMinutes,
            effectiveMinutes,
            actualMinutes: t.actualMinutes,
            startedAt: t.startedAt,
            completedAt: t.completedAt,
            listId: t.listId,
            listName: t.list?.name,
            boardId: t.list?.boardId,
            boardName: t.list?.board?.name,
            workspaceId: t.list?.board?.workspaceId,
            projectId: t.projectId,
            projectName: t.project?.name ?? null,
            milestoneId: t.milestoneId,
            milestoneTitle: t.milestone?.title ?? null,
            assignee: t.assignee,
            isBlocked,
            blockingDependencies: blockingDeps,
            score,
            primaryReason,
            reasons,
        };
    });

    // 5. Deterministic sorting:
    // Criteria:
    // 1. Unblocked first
    // 2. Overdue first
    // 3. Due today first
    // 4. Priority: URGENT > HIGH > MEDIUM > LOW
    // 5. Due soon first
    // 6. Score descending
    // 7. DueDate ascending
    // 8. ID tie breaker (ensures 100% deterministic reproducibility)
    evaluatedTasks.sort((a, b) => {
        // Unblocked vs Blocked
        if (a.isBlocked !== b.isBlocked) {
            return a.isBlocked ? 1 : -1;
        }

        // Overdue
        const aOverdue = a.dueDate ? new Date(a.dueDate) < startOfToday : false;
        const bOverdue = b.dueDate ? new Date(b.dueDate) < startOfToday : false;
        if (aOverdue !== bOverdue) {
            return aOverdue ? -1 : 1;
        }

        // Due today
        const aDueToday = a.dueDate ? new Date(a.dueDate) <= endOfToday : false;
        const bDueToday = b.dueDate ? new Date(b.dueDate) <= endOfToday : false;
        if (aDueToday !== bDueToday) {
            return aDueToday ? -1 : 1;
        }

        // Priority
        const pDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
        if (pDiff !== 0) return pDiff;

        // Score
        if (b.score !== a.score) {
            return b.score - a.score;
        }

        // DueDate ascending
        if (a.dueDate && b.dueDate) {
            const timeDiff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            if (timeDiff !== 0) return timeDiff;
        } else if (a.dueDate && !b.dueDate) {
            return -1;
        } else if (!a.dueDate && b.dueDate) {
            return 1;
        }

        // ID stable tie-breaker
        return a.id.localeCompare(b.id);
    });

    // 6. Separate unblocked vs blocked
    const unblockedTasks = evaluatedTasks.filter((t) => !t.isBlocked);
    const blockedTasks = evaluatedTasks.filter((t) => t.isBlocked);

    // 7. Time budget packing for unblocked tasks
    let accumulatedMinutes = 0;
    const plannedTasks: PlannedTaskItem[] = [];
    const overflowTasks: PlannedTaskItem[] = [];

    for (const task of unblockedTasks) {
        if (accumulatedMinutes + task.effectiveMinutes <= availableMinutes) {
            plannedTasks.push(task);
            accumulatedMinutes += task.effectiveMinutes;
        } else if (plannedTasks.length === 0) {
            // Include at least the top task even if it singlehandedly exceeds availability
            plannedTasks.push(task);
            accumulatedMinutes += task.effectiveMinutes;
        } else {
            overflowTasks.push(task);
        }
    }

    // 8. Split planned tasks into NEXT, UP NEXT, and LATER
    const nextTask = plannedTasks.length > 0 ? (plannedTasks[0] ?? null) : null;
    const upNextTasks = plannedTasks.length > 1 ? plannedTasks.slice(1, 3) : [];
    const laterTasks = plannedTasks.length > 3 ? plannedTasks.slice(3) : [];

    // Calculate completed minutes today
    let completedMinutes = 0;
    const completedItems: PlannedTaskItem[] = completedTodayTasks.map((t) => {
        const mins = t.actualMinutes || t.estimatedMinutes || 30;
        completedMinutes += mins;
        return {
            id: t.id,
            title: t.title,
            description: null,
            priority: t.priority,
            dueDate: t.dueDate,
            completed: true,
            coverUrl: null,
            estimatedMinutes: t.estimatedMinutes,
            effectiveMinutes: mins,
            actualMinutes: t.actualMinutes,
            startedAt: null,
            completedAt: t.completedAt,
            listId: t.listId,
            listName: t.list?.name,
            boardId: t.list?.board?.id,
            boardName: t.list?.board?.name,
            workspaceId: t.list?.board?.workspaceId,
            projectId: t.projectId,
            projectName: t.project?.name ?? null,
            milestoneId: null,
            milestoneTitle: null,
            assignee: t.assignee ? {
                id: t.assignee.id,
                name: t.assignee.name,
                email: "",
                avatarUrl: t.assignee.avatarUrl,
            } : null,
            isBlocked: false,
            blockingDependencies: [],
            score: 0,
            primaryReason: "Completed today",
            reasons: ["Completed today"],
        };
    });

    return {
        date: startOfToday.toISOString().slice(0, 10),
        availableMinutes,
        plannedMinutes: accumulatedMinutes,
        completedMinutes,
        plannedTimeFormatted: formatMinutes(accumulatedMinutes) + " planned",
        availableTimeFormatted: formatMinutes(availableMinutes),
        completedTimeFormatted: formatMinutes(completedMinutes),
        summary: {
            totalPlanned: plannedTasks.length,
            totalBlocked: blockedTasks.length,
            totalOverflow: overflowTasks.length,
            totalCompletedToday: completedItems.length,
        },
        sections: {
            next: nextTask,
            upNext: upNextTasks,
            later: laterTasks,
            blocked: blockedTasks,
            overflow: overflowTasks,
            completedToday: completedItems,
        },
    };
};
