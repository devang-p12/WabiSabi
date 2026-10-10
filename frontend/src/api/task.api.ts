import { api } from "./client";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Label {
    id: string;
    name: string;
    color: string;
    boardId: string;
    createdAt: string;
}

export interface TaskAssignee {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
}

import type { TaskAttachment } from "./attachment.api";

export interface TaskDependency {
    id: string;
    taskId: string;
    dependsOnId: string;
    createdAt: string;
    task?: {
        id: string;
        title: string;
        completed: boolean;
        priority?: TaskPriority;
        dueDate?: string | null;
    };
    dependsOn?: {
        id: string;
        title: string;
        completed: boolean;
        priority?: TaskPriority;
        dueDate?: string | null;
    };
}

export interface Task {
    id: string;
    title: string;
    description: string | null;
    position: number;
    listId: string;
    priority: TaskPriority;
    dueDate: string | null;
    completed: boolean;
    coverUrl?: string | null;
    estimatedMinutes?: number | null;
    actualMinutes?: number | null;
    startedAt?: string | null;
    completedAt?: string | null;
    assigneeId?: string | null;
    assignee?: TaskAssignee | null;
    projectId?: string | null;
    project?: { id: string; name: string } | null;
    milestoneId?: string | null;
    milestone?: { id: string; title: string; position: number } | null;
    list?: { id: string; name: string } | null;
    dependencies?: TaskDependency[];
    dependedOnBy?: TaskDependency[];
    createdAt: string;
    updatedAt: string;
    labels: Label[];
    subtasks?: { id: string; title: string; completed: boolean }[];
    attachments?: TaskAttachment[];
}

export interface CreateTaskInput {
    title: string;
    description?: string;
    priority?: TaskPriority;
    dueDate?: string | null;
    assigneeId?: string | null;
    coverUrl?: string | null;
    projectId?: string | null;
    milestoneId?: string | null;
    estimatedMinutes?: number | null;
    actualMinutes?: number | null;
    startedAt?: string | null;
    completedAt?: string | null;
}

export interface UpdateTaskInput {
    title?: string;
    description?: string | null;
    priority?: TaskPriority;
    dueDate?: string | null;
    completed?: boolean;
    assigneeId?: string | null;
    coverUrl?: string | null;
    projectId?: string | null;
    milestoneId?: string | null;
    estimatedMinutes?: number | null;
    actualMinutes?: number | null;
    startedAt?: string | null;
    completedAt?: string | null;
}

export const getListTasks = async (
    listId: string
): Promise<Task[]> => {
    const response = await api.get(
        `/lists/${listId}/tasks`
    );

    return response.data.data.tasks;
};

export const getTask = async (
    taskId: string
): Promise<Task> => {
    const response = await api.get(
        `/tasks/${taskId}`
    );

    return response.data.data.task;
};

export const createTask = async (
    listId: string,
    data: CreateTaskInput
): Promise<Task> => {
    const response = await api.post(
        `/lists/${listId}/tasks`,
        data
    );

    return response.data.data.task;
};


export const updateTask = async (
    taskId: string,
    data: UpdateTaskInput
): Promise<Task> => {
    const response = await api.patch(
        `/tasks/${taskId}`,
        data
    );

    return response.data.data.task;
};


export const deleteTask = async (
    taskId: string
): Promise<void> => {
    await api.delete(`/tasks/${taskId}`);
};

export const moveTask = async (
    taskId: string,
    listId: string,
    position: number,
): Promise<Task> => {
    const response = await api.patch(
        `/tasks/${taskId}/move`,
        {
            listId,
            position,
        },
    );

    return response.data.data;
};

export const createTaskDependency = async (
    taskId: string,
    dependsOnId: string
): Promise<TaskDependency> => {
    const response = await api.post(
        `/tasks/${taskId}/dependencies`,
        { dependsOnId }
    );
    return response.data.data;
};

export const getTaskDependencies = async (
    taskId: string
): Promise<{ dependencies: TaskDependency[]; dependedOnBy: TaskDependency[] }> => {
    const response = await api.get(
        `/tasks/${taskId}/dependencies`
    );
    return response.data.data;
};

export const deleteTaskDependency = async (
    taskId: string,
    dependsOnId: string
): Promise<void> => {
    await api.delete(
        `/tasks/${taskId}/dependencies/${dependsOnId}`
    );
};