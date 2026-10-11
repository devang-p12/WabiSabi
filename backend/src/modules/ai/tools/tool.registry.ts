import { z } from "zod";
import type { ToolDefinition } from "./tool.interface.js";
import {
    getProject as getProjectService,
    createMilestone as createMilestoneService,
} from "../../project/project.service.js";
import {
    createTask as createTaskService,
    updateTask as updateTaskService,
    createTaskDependency as createTaskDependencyService,
} from "../../task/task.service.js";
import { getTodayPlan } from "../../planner/planner.service.js";
import { aiService } from "../ai.service.js";
import { prisma } from "../../../config/prisma.js";

// ==========================================
// 1. getProject
// ==========================================
export const getProjectTool: ToolDefinition = {
    name: "getProject",
    description: "Fetch comprehensive project details, milestones, and metadata for a given project ID.",
    parameters: z.object({
        projectId: z.string().uuid("A valid projectId UUID is required"),
    }),
    execute: async ({ projectId }, context) => {
        const result = await getProjectService(projectId, context.userId);
        if ("error" in result && result.error) {
            throw new Error(result.error);
        }
        if (!result.project || result.project.workspace.id !== context.workspaceId) {
            throw new Error("Project not found or does not belong to this workspace.");
        }
        return {
            id: result.project.id,
            name: result.project.name,
            description: result.project.description,
            totalTasks: result.project.totalTasks,
            completedTasks: result.project.completedTasks,
            progressPercentage: result.project.progressPercentage,
            milestones: result.project.milestones.map((m) => ({
                id: m.id,
                title: m.title,
                tasksCount: m.tasks.length,
            })),
        };
    },
};

// ==========================================
// 2. getProjectTasks
// ==========================================
export const getProjectTasksTool: ToolDefinition = {
    name: "getProjectTasks",
    description: "List tasks within a project with their completion status, priority, due date, and milestone.",
    parameters: z.object({
        projectId: z.string().uuid("A valid projectId UUID is required"),
        completed: z.boolean().optional(),
    }),
    execute: async ({ projectId, completed }, context) => {
        // Verify project belongs to workspace
        const project = await prisma.project.findFirst({
            where: { id: projectId, workspaceId: context.workspaceId },
        });
        if (!project) {
            throw new Error("Project not found in this workspace.");
        }

        const tasks = await prisma.task.findMany({
            where: {
                projectId,
                ...(completed !== undefined ? { completed } : {}),
            },
            include: {
                milestone: { select: { id: true, title: true } },
                assignee: { select: { id: true, name: true } },
            },
            orderBy: { position: "asc" },
        });

        return tasks.map((t) => ({
            id: t.id,
            title: t.title,
            completed: t.completed,
            priority: t.priority,
            estimatedMinutes: t.estimatedMinutes,
            actualMinutes: t.actualMinutes,
            dueDate: t.dueDate?.toISOString().split("T")[0] || null,
            milestone: t.milestone?.title || null,
            assignee: t.assignee?.name || null,
        }));
    },
};

// ==========================================
// 3. getProjectProgress
// ==========================================
export const getProjectProgressTool: ToolDefinition = {
    name: "getProjectProgress",
    description: "Calculate overall progress percentage, task counts, velocity, and time variance for a project.",
    parameters: z.object({
        projectId: z.string().uuid("A valid projectId UUID is required"),
    }),
    execute: async ({ projectId }, context) => {
        const project = await prisma.project.findFirst({
            where: { id: projectId, workspaceId: context.workspaceId },
            include: {
                tasks: {
                    select: {
                        id: true,
                        completed: true,
                        estimatedMinutes: true,
                        actualMinutes: true,
                    },
                },
            },
        });
        if (!project) {
            throw new Error("Project not found in this workspace.");
        }

        const totalTasks = project.tasks.length;
        const completedTasks = project.tasks.filter((t) => t.completed).length;
        const progressPercentage =
            totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        let totalEstimatedMinutes = 0;
        let totalActualMinutes = 0;
        for (const t of project.tasks) {
            totalEstimatedMinutes += t.estimatedMinutes ?? 0;
            totalActualMinutes += t.actualMinutes ?? 0;
        }

        return {
            projectId: project.id,
            projectName: project.name,
            totalTasks,
            completedTasks,
            incompleteTasks: totalTasks - completedTasks,
            progressPercentage,
            totalEstimatedMinutes,
            totalActualMinutes,
            timeVarianceMinutes: totalActualMinutes - totalEstimatedMinutes,
        };
    },
};

// ==========================================
// 4. getTodayPlan
// ==========================================
export const getTodayPlanTool: ToolDefinition = {
    name: "getTodayPlan",
    description: "Get today's prioritized schedule, estimated workload, and planned tasks for the user in this workspace.",
    parameters: z.object({
        projectId: z.string().uuid().optional(),
    }),
    execute: async ({ projectId }, context) => {
        const plan = await getTodayPlan({
            userId: context.userId,
            workspaceId: context.workspaceId,
            ...(projectId ? { projectId } : {}),
        });

        const allPlanned = [
            ...(plan.sections.next ? [plan.sections.next] : []),
            ...plan.sections.upNext,
            ...plan.sections.later,
        ];

        return {
            date: plan.date,
            plannedTimeFormatted: plan.plannedTimeFormatted,
            summary: plan.summary,
            plannedTasks: allPlanned.map((t) => ({
                id: t.id,
                title: t.title,
                priority: t.priority,
                effectiveMinutes: t.effectiveMinutes,
                isBlocked: t.isBlocked,
                primaryReason: t.primaryReason,
            })),
        };
    },
};

// ==========================================
// 5. getBlockedTasks
// ==========================================
export const getBlockedTasksTool: ToolDefinition = {
    name: "getBlockedTasks",
    description: "Identify all incomplete tasks blocked by unfinished dependencies in a project or workspace.",
    parameters: z.object({
        projectId: z.string().uuid().optional(),
    }),
    execute: async ({ projectId }, context) => {
        const tasks = await prisma.task.findMany({
            where: {
                completed: false,
                list: { board: { workspaceId: context.workspaceId } },
                ...(projectId ? { projectId } : {}),
            },
            include: {
                dependencies: {
                    include: {
                        dependsOn: {
                            select: { id: true, title: true, completed: true },
                        },
                    },
                },
                project: { select: { id: true, name: true } },
            },
        });

        const blocked = tasks
            .filter((t) => t.dependencies.some((d) => !d.dependsOn.completed))
            .map((t) => ({
                id: t.id,
                title: t.title,
                priority: t.priority,
                project: t.project?.name || null,
                blockedBy: t.dependencies
                    .filter((d) => !d.dependsOn.completed)
                    .map((d) => ({
                        id: d.dependsOn.id,
                        title: d.dependsOn.title,
                    })),
            }));

        return {
            blockedCount: blocked.length,
            blockedTasks: blocked,
        };
    },
};

// ==========================================
// 6. createTask
// ==========================================
export const createTaskTool: ToolDefinition = {
    name: "createTask",
    description: "Create a new task within a board or project with specified title, priority, estimate, and milestone.",
    parameters: z.object({
        title: z.string().min(1, "Task title is required"),
        description: z.string().optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
        estimatedMinutes: z.number().int().positive().optional(),
        projectId: z.string().uuid().optional(),
        milestoneId: z.string().uuid().optional(),
        listId: z.string().uuid().optional(),
    }),
    execute: async (params, context) => {
        let targetListId = params.listId;

        // If listId not provided, locate first list in workspace board
        if (!targetListId) {
            const firstBoard = await prisma.board.findFirst({
                where: { workspaceId: context.workspaceId },
                include: { lists: { orderBy: { position: "asc" } } },
            });
            if (firstBoard && firstBoard.lists.length > 0) {
                targetListId = firstBoard.lists[0]?.id;
            }
        }

        if (!targetListId) {
            throw new Error("No board list found in workspace to place the task.");
        }

        const result = await createTaskService(targetListId, context.userId, {
            title: params.title,
            description: params.description,
            priority: params.priority,
            estimatedMinutes: params.estimatedMinutes,
            projectId: params.projectId,
            milestoneId: params.milestoneId,
        });

        if ("error" in result && result.error) {
            throw new Error(result.error);
        }

        return {
            id: result.task.id,
            title: result.task.title,
            priority: result.task.priority,
            estimatedMinutes: result.task.estimatedMinutes,
            message: "Task created successfully.",
        };
    },
};

// ==========================================
// 7. updateTask
// ==========================================
export const updateTaskTool: ToolDefinition = {
    name: "updateTask",
    description: "Update task properties such as title, description, priority, estimates, or due date.",
    parameters: z.object({
        taskId: z.string().uuid("Valid taskId UUID is required"),
        title: z.string().optional(),
        description: z.string().optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
        estimatedMinutes: z.number().int().positive().optional(),
        actualMinutes: z.number().int().nonnegative().optional(),
        dueDate: z.string().optional(),
    }),
    execute: async (params, context) => {
        const { taskId, ...updateData } = params;

        // Verify task workspace membership
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: { list: { include: { board: true } } },
        });

        if (!task || task.list.board.workspaceId !== context.workspaceId) {
            throw new Error("Task not found in this workspace.");
        }

        const result = await updateTaskService(taskId, context.userId, updateData);
        if ("error" in result && result.error) {
            throw new Error(result.error);
        }

        return {
            id: result.task.id,
            title: result.task.title,
            priority: result.task.priority,
            completed: result.task.completed,
            message: "Task updated successfully.",
        };
    },
};

// ==========================================
// 8. completeTask
// ==========================================
export const completeTaskTool: ToolDefinition = {
    name: "completeTask",
    description: "Mark a task as completed or uncompleted.",
    parameters: z.object({
        taskId: z.string().uuid("Valid taskId UUID is required"),
        completed: z.boolean().default(true),
    }),
    execute: async ({ taskId, completed }, context) => {
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: { list: { include: { board: true } } },
        });

        if (!task || task.list.board.workspaceId !== context.workspaceId) {
            throw new Error("Task not found in this workspace.");
        }

        const result = await updateTaskService(taskId, context.userId, { completed });
        if ("error" in result && result.error) {
            throw new Error(result.error);
        }

        return {
            id: result.task.id,
            title: result.task.title,
            completed: result.task.completed,
            completedAt: result.task.completedAt,
            message: `Task "${result.task.title}" marked as ${completed ? "completed" : "incomplete"}.`,
        };
    },
};

// ==========================================
// 9. createMilestone
// ==========================================
export const createMilestoneTool: ToolDefinition = {
    name: "createMilestone",
    description: "Create a new milestone in a project.",
    parameters: z.object({
        projectId: z.string().uuid("Valid projectId UUID is required"),
        title: z.string().min(1, "Milestone title is required"),
        position: z.number().int().nonnegative().optional(),
    }),
    execute: async (params, context) => {
        const project = await prisma.project.findFirst({
            where: { id: params.projectId, workspaceId: context.workspaceId },
        });
        if (!project) {
            throw new Error("Project not found in this workspace.");
        }

        const result = await createMilestoneService(params.projectId, context.userId, {
            title: params.title,
            position: params.position,
        });

        if ("error" in result && result.error) {
            throw new Error(result.error);
        }

        return {
            id: result.milestone.id,
            title: result.milestone.title,
            position: result.milestone.position,
            message: "Milestone created successfully.",
        };
    },
};

// ==========================================
// 10. createDependency
// ==========================================
export const createDependencyTool: ToolDefinition = {
    name: "createDependency",
    description: "Establish a dependency where task A depends on task B being completed first.",
    parameters: z.object({
        taskId: z.string().uuid("Dependent task ID is required"),
        dependsOnId: z.string().uuid("Prerequisite task ID is required"),
    }),
    execute: async ({ taskId, dependsOnId }, context) => {
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

        if (
            !taskA ||
            !taskB ||
            taskA.list.board.workspaceId !== context.workspaceId ||
            taskB.list.board.workspaceId !== context.workspaceId
        ) {
            throw new Error("Tasks not found in this workspace.");
        }

        const result = await createTaskDependencyService(taskId, dependsOnId, context.userId);
        if ("error" in result && result.error) {
            throw new Error(result.error);
        }

        return {
            dependencyId: result.dependency.id,
            taskId: result.dependency.taskId,
            dependsOnId: result.dependency.dependsOnId,
            message: `Dependency created: "${taskA.title}" now depends on "${taskB.title}".`,
        };
    },
};

// ==========================================
// 11. replanProject
// ==========================================
export const replanProjectTool: ToolDefinition = {
    name: "replanProject",
    description: "Generate an adaptive replan analyzing task delays, blockers, and velocity for a project.",
    parameters: z.object({
        projectId: z.string().uuid("Valid projectId UUID is required"),
    }),
    execute: async ({ projectId }, context) => {
        const project = await prisma.project.findFirst({
            where: { id: projectId, workspaceId: context.workspaceId },
        });
        if (!project) {
            throw new Error("Project not found in this workspace.");
        }

        const result = await aiService.generateAdaptiveReplan(projectId, context.userId);
        if (result.error) {
            throw new Error(result.error);
        }

        return result.replan;
    },
};
