import { prisma } from "../../config/prisma.js";

import {
    getWorkspaceMembership,
    requireWorkspaceAdmin,
} from "../workspace/workspace.authorization.js";
import { getIO } from "../../socket.js";
import { createNotification } from "../notification/notification.service.js";

export const createTask = async (
    listId: string,
    userId: string,
    data: {
        title: string;
        description?: string | undefined;
        priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
        dueDate?: string | null | undefined;
        assigneeId?: string | null | undefined;
        coverUrl?: string | null | undefined;
        projectId?: string | null | undefined;
        milestoneId?: string | null | undefined;
        estimatedMinutes?: number | null | undefined;
        actualMinutes?: number | null | undefined;
        startedAt?: string | null | undefined;
        completedAt?: string | null | undefined;
    }
) => {
    const list = await prisma.boardList.findUnique({
        where: {
            id: listId,
        },
        include: {
            board: true,
        },
    });

    if (!list) {
        return {
            error: "List not found.",
        } as const;
    }

    const membership = await getWorkspaceMembership(
        list.board.workspaceId,
        userId
    );

    if (!membership) {
        return {
            error: "You are not a member of this workspace.",
        } as const;
    }

    const lastTask = await prisma.task.findFirst({
        where: {
            listId,
        },
        orderBy: {
            position: "desc",
        },
    });

    const position = lastTask
        ? lastTask.position + 1
        : 0;

    const task = await prisma.task.create({
        data: {
            title: data.title,
            ...(data.description !== undefined && {
                description: data.description,
            }),
            listId,
            priority: data.priority ?? "MEDIUM",
            dueDate: data.dueDate
                ? new Date(data.dueDate)
                : null,
            assigneeId: data.assigneeId ?? null,
            coverUrl: data.coverUrl ?? null,
            projectId: data.projectId ?? null,
            milestoneId: data.milestoneId ?? null,
            estimatedMinutes: data.estimatedMinutes ?? null,
            actualMinutes: data.actualMinutes ?? null,
            startedAt: data.startedAt ? new Date(data.startedAt) : null,
            completedAt: data.completedAt ? new Date(data.completedAt) : null,
        },
        include: {
            assignee: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
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
                    position: true,
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
                            dueDate: true,
                        },
                    },
                },
            },
            dependedOnBy: {
                include: {
                    task: {
                        select: {
                            id: true,
                            title: true,
                            completed: true,
                            priority: true,
                            dueDate: true,
                        },
                    },
                },
            },
            labels: {
                include: {
                    label: true,
                },
            },
            subtasks: true,
            attachments: true,
        },
    });

    await prisma.activityLog.create({
        data: {
            action: "CREATE",
            entityType: "TASK",
            entityId: task.id,
            entityTitle: task.title,
            userId,
            boardId: list.board.id,
            taskId: task.id,
        },
    });

    try {
        getIO().to(`board_${list.board.id}`).emit("board_updated");
    } catch (e) {
        console.error("Socket error on createTask:", e);
    }

    if (task.assigneeId && task.assigneeId !== userId) {
        try {
            const actor = await prisma.user.findUnique({
                where: { id: userId },
                select: { name: true },
            });
            await createNotification({
                userId: task.assigneeId,
                actorId: userId,
                type: "TASK_ASSIGNED",
                title: "Assigned to a task",
                message: `${actor?.name ?? "Someone"} assigned you to "${task.title}"`,
                taskId: task.id,
                boardId: list.board.id,
                workspaceId: list.board.workspaceId,
            });
        } catch (e) {
            console.error("Error creating assignment notification on createTask:", e);
        }
    }

    return {
        task,
    } as const;
};

export const getListTasks = async (
    listId: string,
    userId: string
) => {
    const list = await prisma.boardList.findUnique({
        where: {
            id: listId,
        },
        include: {
            board: true,
        },
    });

    if (!list) {
        return {
            error: "List not found.",
        } as const;
    }

    const membership = await getWorkspaceMembership(
        list.board.workspaceId,
        userId
    );

    if (!membership) {
        return {
            error: "You are not a member of this workspace.",
        } as const;
    }

    const tasks = await prisma.task.findMany({
        where: {
            listId,
        },
        orderBy: {
            position: "asc",
        },
        include: {
            assignee: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
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
                    position: true,
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
                            dueDate: true,
                        },
                    },
                },
            },
            dependedOnBy: {
                include: {
                    task: {
                        select: {
                            id: true,
                            title: true,
                            completed: true,
                            priority: true,
                            dueDate: true,
                        },
                    },
                },
            },
            labels: {
                include: {
                    label: true,
                },
            },
            subtasks: true,
            attachments: true,
        },
    });
    return {
        tasks: tasks.map((task) => ({
            ...task,
            labels: task.labels.map((taskLabel) => taskLabel.label),
        })),
    } as const;
};

export const getTask = async (
    taskId: string,
    userId: string
) => {
    const task = await prisma.task.findUnique({
        where: {
            id: taskId,
        },
        include: {
            list: {
                include: {
                    board: true,
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
                    position: true,
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
                            dueDate: true,
                        },
                    },
                },
            },
            dependedOnBy: {
                include: {
                    task: {
                        select: {
                            id: true,
                            title: true,
                            completed: true,
                            priority: true,
                            dueDate: true,
                        },
                    },
                },
            },
            labels: {
                include: {
                    label: true,
                },
            },
            subtasks: true,
            attachments: true,
        },
    });
    if (!task) {
        return {
            error: "Task not found.",
        } as const;
    }

    const membership = await getWorkspaceMembership(
        task.list.board.workspaceId,
        userId
    );

    if (!membership) {
        return {
            error: "You do not have access to this task.",
        } as const;
    }

    return {
        task: {
            ...task,
            labels: task.labels.map((taskLabel) => taskLabel.label),
        },
    } as const;
};

export const updateTask = async (
    taskId: string,
    userId: string,
    data: {
        title?: string | undefined;
        description?: string | null | undefined;
        priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
        dueDate?: string | null | undefined;
        completed?: boolean | undefined;
        assigneeId?: string | null | undefined;
        coverUrl?: string | null | undefined;
        projectId?: string | null | undefined;
        milestoneId?: string | null | undefined;
        estimatedMinutes?: number | null | undefined;
        actualMinutes?: number | null | undefined;
        startedAt?: string | null | undefined;
        completedAt?: string | null | undefined;
    }
) => {
    const task = await prisma.task.findUnique({
        where: {
            id: taskId,
        },
        include: {
            list: {
                include: {
                    board: true,
                },
            },
        },
    });

    if (!task) {
        return {
            error: "Task not found.",
        } as const;
    }

    const membership = await getWorkspaceMembership(
        task.list.board.workspaceId,
        userId
    );

    if (!membership) {
        return {
            error: "You do not have permission to update this task.",
        } as const;
    }

    let nextCompletedAt = undefined;
    if (data.completedAt !== undefined) {
        nextCompletedAt = data.completedAt ? new Date(data.completedAt) : null;
    } else if (data.completed !== undefined) {
        if (data.completed && !task.completed) {
            nextCompletedAt = new Date();
        } else if (!data.completed && task.completed) {
            nextCompletedAt = null;
        }
    }

    const updatedTask = await prisma.task.update({
        where: {
            id: taskId,
        },

        data: {
            ...(data.title !== undefined && {
                title: data.title,
            }),

            ...(data.description !== undefined && {
                description: data.description,
            }),

            ...(data.priority !== undefined && {
                priority: data.priority,
            }),

            ...(data.dueDate !== undefined && {
                dueDate: data.dueDate
                    ? new Date(data.dueDate)
                    : null,
            }),
            ...(data.completed !== undefined && {
                completed: data.completed,
            }),
            ...(nextCompletedAt !== undefined && {
                completedAt: nextCompletedAt,
            }),

            ...(data.startedAt !== undefined && {
                startedAt: data.startedAt ? new Date(data.startedAt) : null,
            }),

            ...(data.estimatedMinutes !== undefined && {
                estimatedMinutes: data.estimatedMinutes,
            }),

            ...(data.actualMinutes !== undefined && {
                actualMinutes: data.actualMinutes,
            }),

            ...(data.assigneeId !== undefined && {
                assigneeId: data.assigneeId,
            }),

            ...(data.coverUrl !== undefined && {
                coverUrl: data.coverUrl,
            }),

            ...(data.projectId !== undefined && {
                projectId: data.projectId,
            }),

            ...(data.milestoneId !== undefined && {
                milestoneId: data.milestoneId,
            }),
        },

        include: {
            assignee: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
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
                    position: true,
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
                            dueDate: true,
                        },
                    },
                },
            },
            dependedOnBy: {
                include: {
                    task: {
                        select: {
                            id: true,
                            title: true,
                            completed: true,
                            priority: true,
                            dueDate: true,
                        },
                    },
                },
            },
            labels: {
                include: {
                    label: true,
                },
            },
            subtasks: true,
            attachments: true,
        },
    });

    await prisma.activityLog.create({
        data: {
            action: "UPDATE",
            entityType: "TASK",
            entityId: updatedTask.id,
            entityTitle: updatedTask.title,
            userId,
            boardId: task.list.board.id,
            taskId: updatedTask.id,
        },
    });

    try {
        getIO().to(`board_${task.list.board.id}`).emit("board_updated");
    } catch (e) {
        console.error("Socket error on updateTask:", e);
    }

    if (
        data.assigneeId &&
        data.assigneeId !== task.assigneeId &&
        data.assigneeId !== userId
    ) {
        try {
            const actor = await prisma.user.findUnique({
                where: { id: userId },
                select: { name: true },
            });
            await createNotification({
                userId: data.assigneeId,
                actorId: userId,
                type: "TASK_ASSIGNED",
                title: "Assigned to a task",
                message: `${actor?.name ?? "Someone"} assigned you to "${updatedTask.title}"`,
                taskId: updatedTask.id,
                boardId: task.list.board.id,
                workspaceId: task.list.board.workspaceId,
            });
        } catch (e) {
            console.error("Error creating assignment notification on updateTask:", e);
        }
    }

    return {
        task: {
            ...updatedTask,
            labels: updatedTask.labels.map(
                (taskLabel) => taskLabel.label
            ),
        },
    } as const;
};

export const deleteTask = async (
    taskId: string,
    userId: string
) => {
    const task = await prisma.task.findUnique({
        where: {
            id: taskId,
        },
        include: {
            list: {
                include: {
                    board: true,
                },
            },
        },
    });

    if (!task) {
        return {
            error: "Task not found.",
        } as const;
    }

    const membership = await requireWorkspaceAdmin(
        task.list.board.workspaceId,
        userId
    );

    if (!membership) {
        return {
            error: "You do not have permission to delete this task.",
        } as const;
    }

    await prisma.task.delete({
        where: {
            id: taskId,
        },
    });

    await prisma.activityLog.create({
        data: {
            action: "DELETE",
            entityType: "TASK",
            entityId: task.id,
            entityTitle: task.title,
            userId,
            boardId: task.list.board.id,
        },
    });

    try {
        getIO().to(`board_${task.list.board.id}`).emit("board_updated");
    } catch (e) {
        console.error("Socket error on deleteTask:", e);
    }

    return {
        success: true,
    } as const;
};

export const moveTask = async (
    taskId: string,
    userId: string,
    targetListId: string,
    targetPosition: number
) => {
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
            list: {
                include: {
                    board: true,
                },
            },
        },
    });

    if (!task) {
        throw new Error("Task not found.");
    }

    const sourceWorkspaceId = task.list.board.workspaceId;

    // Verify current user belongs to the workspace
    const membership = await getWorkspaceMembership(
        sourceWorkspaceId,
        userId
    );

    if (!membership) {
        throw new Error(
            "You are not a member of this workspace."
        );
    }

    const targetList = await prisma.boardList.findUnique({
        where: { id: targetListId },
        include: {
            board: true,
        },
    });

    if (!targetList) {
        throw new Error("Target list not found.");
    }

    // Make sure target list belongs to the same workspace
    if (
        targetList.board.workspaceId !==
        sourceWorkspaceId
    ) {
        throw new Error(
            "Target list does not belong to the same workspace."
        );
    }

    const targetMembership =
        await getWorkspaceMembership(
            targetList.board.workspaceId,
            userId
        );

    if (!targetMembership) {
        throw new Error(
            "You are not a member of this workspace."
        );
    }

    const sourceListId = task.listId;

    const result = await prisma.$transaction(async (tx) => {
        // Moving inside the same list
        if (sourceListId === targetListId) {
            const tasks = await tx.task.findMany({
                where: {
                    listId: sourceListId,
                },
                orderBy: {
                    position: "asc",
                },
            });

            const currentIndex = tasks.findIndex(
                (t) => t.id === taskId
            );

            if (currentIndex === -1) {
                throw new Error("Task not found in list.");
            }

            const [movedTask] = tasks.splice(currentIndex, 1);

            if (!movedTask) {
                throw new Error("Task could not be moved.");
            }

            const safePosition = Math.max(
                0,
                Math.min(
                    targetPosition,
                    tasks.length
                )
            );

            tasks.splice(
                safePosition,
                0,
                movedTask
            );

            for (let i = 0; i < tasks.length; i++) {
                const task = tasks[i];

                if (!task) {
                    continue;
                }

                await tx.task.update({
                    where: {
                        id: task.id,
                    },
                    data: {
                        position: i,
                    },
                });
            }

            return tx.task.findUnique({
                where: {
                    id: taskId,
                },
            });
        }

        // Moving to another list

        const sourceTasks = await tx.task.findMany({
            where: {
                listId: sourceListId,
                id: {
                    not: taskId,
                },
            },
            orderBy: {
                position: "asc",
            },
        });

        const targetTasks = await tx.task.findMany({
            where: {
                listId: targetListId,
            },
            orderBy: {
                position: "asc",
            },
        });

        const safePosition = Math.max(
            0,
            Math.min(
                targetPosition,
                targetTasks.length
            )
        );

        // Normalize source list
        for (const [index, task] of sourceTasks.entries()) {
            await tx.task.update({
                where: {
                    id: task.id,
                },
                data: {
                    position: index,
                },
            });
        }

        // Move task to target list
        await tx.task.update({
            where: {
                id: taskId,
            },
            data: {
                listId: targetListId,
                position: safePosition,
            },
        });

        // Normalize target list positions
        const reorderedTargetTasks = [
            ...targetTasks,
        ];

        const movedTaskIndex =
            reorderedTargetTasks.findIndex(
                (t) => t.id === taskId
            );

        if (movedTaskIndex !== -1) {
            reorderedTargetTasks.splice(
                movedTaskIndex,
                1
            );
        }

        reorderedTargetTasks.splice(
            safePosition,
            0,
            {
                ...task,
                listId: targetListId,
                position: safePosition,
            }
        );

        for (const [index, task] of reorderedTargetTasks.entries()) {
            await tx.task.update({
                where: {
                    id: task.id,
                },
                data: {
                    position: index,
                },
            });
        }

        return tx.task.findUnique({
            where: {
                id: taskId,
            },
        });
    });

    try {
        console.log(`[Socket.io] Emitting board_updated for board_${targetList.boardId}`);
        getIO().to(`board_${targetList.boardId}`).emit("board_updated");
    } catch (e) {
        console.error("Socket error on moveTask:", e);
    }

    return result;
};

export const createTaskDependency = async (
    taskId: string,
    dependsOnId: string,
    userId: string
) => {
    if (taskId === dependsOnId) {
        return {
            error: "A task cannot depend on itself.",
        } as const;
    }

    const [taskA, taskB] = await Promise.all([
        prisma.task.findUnique({
            where: { id: taskId },
            include: { list: { include: { board: true } } },
        }),
        prisma.task.findUnique({
            where: { id: dependsOnId },
            include: { list: { include: { board: true } } },
        }),
    ]);

    if (!taskA || !taskB) {
        return {
            error: "One or both tasks not found.",
        } as const;
    }

    const membership = await getWorkspaceMembership(
        taskA.list.board.workspaceId,
        userId
    );

    if (!membership) {
        return {
            error: "You do not have permission to manage dependencies for this task.",
        } as const;
    }

    // Check if duplicate
    const existing = await prisma.taskDependency.findUnique({
        where: {
            taskId_dependsOnId: {
                taskId,
                dependsOnId,
            },
        },
    });

    if (existing) {
        return {
            error: "Dependency already exists.",
        } as const;
    }

    // Check direct circular dependency: Task B depending on Task A
    const circular = await prisma.taskDependency.findUnique({
        where: {
            taskId_dependsOnId: {
                taskId: dependsOnId,
                dependsOnId: taskId,
            },
        },
    });

    if (circular) {
        return {
            error: "Circular dependency detected: target task already depends on this task.",
        } as const;
    }

    const dependency = await prisma.taskDependency.create({
        data: {
            taskId,
            dependsOnId,
        },
        include: {
            task: {
                select: {
                    id: true,
                    title: true,
                    completed: true,
                },
            },
            dependsOn: {
                select: {
                    id: true,
                    title: true,
                    completed: true,
                    priority: true,
                    dueDate: true,
                },
            },
        },
    });

    try {
        getIO().to(`board_${taskA.list.board.id}`).emit("board_updated");
    } catch (e) {
        console.error("Socket error on createTaskDependency:", e);
    }

    return { dependency } as const;
};

export const getTaskDependencies = async (
    taskId: string,
    userId: string
) => {
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { list: { include: { board: true } } },
    });

    if (!task) {
        return {
            error: "Task not found.",
        } as const;
    }

    const membership = await getWorkspaceMembership(
        task.list.board.workspaceId,
        userId
    );

    if (!membership) {
        return {
            error: "You are not a member of this workspace.",
        } as const;
    }

    const [dependencies, dependedOnBy] = await Promise.all([
        prisma.taskDependency.findMany({
            where: { taskId },
            include: {
                dependsOn: {
                    select: {
                        id: true,
                        title: true,
                        completed: true,
                        priority: true,
                        dueDate: true,
                    },
                },
            },
        }),
        prisma.taskDependency.findMany({
            where: { dependsOnId: taskId },
            include: {
                task: {
                    select: {
                        id: true,
                        title: true,
                        completed: true,
                        priority: true,
                        dueDate: true,
                    },
                },
            },
        }),
    ]);

    return { dependencies, dependedOnBy } as const;
};

export const deleteTaskDependency = async (
    taskId: string,
    dependsOnId: string,
    userId: string
) => {
    const dependency = await prisma.taskDependency.findUnique({
        where: {
            taskId_dependsOnId: {
                taskId,
                dependsOnId,
            },
        },
        include: {
            task: {
                include: {
                    list: { include: { board: true } },
                },
            },
        },
    });

    if (!dependency) {
        return {
            error: "Dependency not found.",
        } as const;
    }

    const membership = await getWorkspaceMembership(
        dependency.task.list.board.workspaceId,
        userId
    );

    if (!membership) {
        return {
            error: "You do not have permission to delete this dependency.",
        } as const;
    }

    await prisma.taskDependency.delete({
        where: {
            taskId_dependsOnId: {
                taskId,
                dependsOnId,
            },
        },
    });

    try {
        getIO().to(`board_${dependency.task.list.board.id}`).emit("board_updated");
    } catch (e) {
        console.error("Socket error on deleteTaskDependency:", e);
    }

    return { success: true } as const;
};