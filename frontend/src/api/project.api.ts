import { api } from "./client";
import type { Task } from "./task.api";

export interface Milestone {
    id: string;
    title: string;
    position: number;
    projectId: string;
    createdAt: string;
    updatedAt: string;
    tasks?: Task[];
}

export interface ProjectBoardSummary {
    id: string;
    name: string;
    description: string | null;
}

export interface Project {
    id: string;
    name: string;
    description: string | null;
    workspaceId: string;
    createdAt: string;
    updatedAt: string;
    totalTasks: number;
    completedTasks: number;
    progressPercentage: number;
    milestones: Milestone[];
    tasks?: Task[];
    workspace?: {
        id: string;
        name: string;
        boards: ProjectBoardSummary[];
    };
    _count?: {
        tasks: number;
        milestones: number;
    };
}

export interface CreateProjectInput {
    name: string;
    description?: string;
}

export interface UpdateProjectInput {
    name?: string;
    description?: string | null;
}

export interface CreateMilestoneInput {
    title: string;
    position?: number;
}

export interface UpdateMilestoneInput {
    title?: string;
    position?: number;
}

export const getWorkspaceProjects = async (workspaceId: string): Promise<Project[]> => {
    const res = await api.get<{ success: boolean; data: Project[] }>(
        `/workspaces/${workspaceId}/projects`
    );
    return res.data.data;
};

export const createProject = async (
    workspaceId: string,
    input: CreateProjectInput
): Promise<Project> => {
    const res = await api.post<{ success: boolean; data: Project }>(
        `/workspaces/${workspaceId}/projects`,
        input
    );
    return res.data.data;
};

export const getProject = async (projectId: string): Promise<Project> => {
    const res = await api.get<{ success: boolean; data: Project }>(
        `/projects/${projectId}`
    );
    return res.data.data;
};

export const updateProject = async (
    projectId: string,
    input: UpdateProjectInput
): Promise<Project> => {
    const res = await api.patch<{ success: boolean; data: Project }>(
        `/projects/${projectId}`,
        input
    );
    return res.data.data;
};

export const deleteProject = async (projectId: string): Promise<void> => {
    await api.delete(`/projects/${projectId}`);
};

export const createMilestone = async (
    projectId: string,
    input: CreateMilestoneInput
): Promise<Milestone> => {
    const res = await api.post<{ success: boolean; data: Milestone }>(
        `/projects/${projectId}/milestones`,
        input
    );
    return res.data.data;
};

export const updateMilestone = async (
    milestoneId: string,
    input: UpdateMilestoneInput
): Promise<Milestone> => {
    const res = await api.patch<{ success: boolean; data: Milestone }>(
        `/milestones/${milestoneId}`,
        input
    );
    return res.data.data;
};

export const deleteMilestone = async (milestoneId: string): Promise<void> => {
    await api.delete(`/milestones/${milestoneId}`);
};
