import { api } from "./client";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Task {
    id: string;
    title: string;
    description: string | null;
    position: number;
    listId: string;
    priority: TaskPriority;
    dueDate: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTaskInput {
    title: string;
    description?: string;
    priority?: TaskPriority;
    dueDate?: string | null;
}

export interface UpdateTaskInput {
    title?: string;
    description?: string | null;
    priority?: TaskPriority;
    dueDate?: string | null;
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
) => {
    const response = await api.post(
        `/lists/${listId}/tasks`,
        data
    );

    return response.data;
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