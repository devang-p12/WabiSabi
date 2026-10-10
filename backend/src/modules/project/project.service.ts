import { prisma } from "../../config/prisma.js";
import { getWorkspaceMembership, requireWorkspaceAdmin } from "../workspace/workspace.authorization.js";

export const createProject = async (
    workspaceId: string,
    userId: string,
    data: {
        name: string;
        description?: string | undefined;
    }
) => {
    const membership = await getWorkspaceMembership(workspaceId, userId);
    if (!membership) {
        return {
            error: "You are not a member of this workspace.",
        } as const;
    }

    const project = await prisma.project.create({
        data: {
            name: data.name,
            description: data.description ?? null,
            workspaceId,
        },
        include: {
            milestones: true,
            _count: {
                select: {
                    tasks: true,
                    milestones: true,
                },
            },
        },
    });

    return { project } as const;
};

export const getWorkspaceProjects = async (
    workspaceId: string,
    userId: string
) => {
    const membership = await getWorkspaceMembership(workspaceId, userId);
    if (!membership) {
        return {
            error: "You are not a member of this workspace.",
        } as const;
    }

    const projects = await prisma.project.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "desc" },
        include: {
            milestones: {
                orderBy: { position: "asc" },
            },
            tasks: {
                select: {
                    id: true,
                    completed: true,
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

    const formattedProjects = projects.map((p) => {
        const totalTasks = p.tasks.length;
        const completedTasks = p.tasks.filter((t) => t.completed).length;
        const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const { tasks, ...rest } = p;
        return {
            ...rest,
            totalTasks,
            completedTasks,
            progressPercentage,
        };
    });

    return { projects: formattedProjects } as const;
};

export const getProject = async (
    projectId: string,
    userId: string
) => {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
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
            milestones: {
                orderBy: { position: "asc" },
                include: {
                    tasks: {
                        select: {
                            id: true,
                            title: true,
                            completed: true,
                            priority: true,
                            dueDate: true,
                            listId: true,
                        },
                    },
                },
            },
            tasks: {
                include: {
                    assignee: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatarUrl: true,
                        },
                    },
                    milestone: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                    list: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    labels: {
                        include: {
                            label: true,
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

    if (!project) {
        return {
            error: "Project not found.",
        } as const;
    }

    const membership = await getWorkspaceMembership(project.workspaceId, userId);
    if (!membership) {
        return {
            error: "You do not have access to this project.",
        } as const;
    }

    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter((t) => t.completed).length;
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
        project: {
            ...project,
            totalTasks,
            completedTasks,
            progressPercentage,
        },
    } as const;
};

export const updateProject = async (
    projectId: string,
    userId: string,
    data: {
        name?: string | undefined;
        description?: string | null | undefined;
    }
) => {
    const existing = await prisma.project.findUnique({
        where: { id: projectId },
    });

    if (!existing) {
        return {
            error: "Project not found.",
        } as const;
    }

    const membership = await getWorkspaceMembership(existing.workspaceId, userId);
    if (!membership) {
        return {
            error: "You do not have permission to update this project.",
        } as const;
    }

    const project = await prisma.project.update({
        where: { id: projectId },
        data: {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.description !== undefined && { description: data.description }),
        },
        include: {
            milestones: {
                orderBy: { position: "asc" },
            },
        },
    });

    return { project } as const;
};

export const deleteProject = async (
    projectId: string,
    userId: string
) => {
    const existing = await prisma.project.findUnique({
        where: { id: projectId },
    });

    if (!existing) {
        return {
            error: "Project not found.",
        } as const;
    }

    const membership = await requireWorkspaceAdmin(existing.workspaceId, userId);
    if (!membership) {
        return {
            error: "You do not have permission to delete this project.",
        } as const;
    }

    await prisma.project.delete({
        where: { id: projectId },
    });

    return { success: true } as const;
};

// --- Milestone Services ---

export const createMilestone = async (
    projectId: string,
    userId: string,
    data: {
        title: string;
        position?: number | undefined;
    }
) => {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
    });

    if (!project) {
        return {
            error: "Project not found.",
        } as const;
    }

    const membership = await getWorkspaceMembership(project.workspaceId, userId);
    if (!membership) {
        return {
            error: "You are not a member of this workspace.",
        } as const;
    }

    let position = data.position;
    if (position === undefined) {
        const lastMilestone = await prisma.milestone.findFirst({
            where: { projectId },
            orderBy: { position: "desc" },
        });
        position = lastMilestone ? lastMilestone.position + 1 : 0;
    }

    const milestone = await prisma.milestone.create({
        data: {
            title: data.title,
            position,
            projectId,
        },
    });

    return { milestone } as const;
};

export const updateMilestone = async (
    milestoneId: string,
    userId: string,
    data: {
        title?: string | undefined;
        position?: number | undefined;
    }
) => {
    const milestone = await prisma.milestone.findUnique({
        where: { id: milestoneId },
        include: { project: true },
    });

    if (!milestone) {
        return {
            error: "Milestone not found.",
        } as const;
    }

    const membership = await getWorkspaceMembership(milestone.project.workspaceId, userId);
    if (!membership) {
        return {
            error: "You do not have permission to update this milestone.",
        } as const;
    }

    const updated = await prisma.milestone.update({
        where: { id: milestoneId },
        data: {
            ...(data.title !== undefined && { title: data.title }),
            ...(data.position !== undefined && { position: data.position }),
        },
    });

    return { milestone: updated } as const;
};

export const deleteMilestone = async (
    milestoneId: string,
    userId: string
) => {
    const milestone = await prisma.milestone.findUnique({
        where: { id: milestoneId },
        include: { project: true },
    });

    if (!milestone) {
        return {
            error: "Milestone not found.",
        } as const;
    }

    const membership = await getWorkspaceMembership(milestone.project.workspaceId, userId);
    if (!membership) {
        return {
            error: "You do not have permission to delete this milestone.",
        } as const;
    }

    await prisma.milestone.delete({
        where: { id: milestoneId },
    });

    return { success: true } as const;
};
