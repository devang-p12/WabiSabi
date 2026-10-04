import { api } from "./client";

export interface Subtask {
    id: string;
    title: string;
    completed: boolean;
    taskId: string;
    createdAt: string;
    updatedAt: string;
}

export const getTaskSubtasks = async (taskId: string): Promise<Subtask[]> => {
    const response = await api.get(`/tasks/${taskId}/subtasks`);
    return response.data.data.subtasks;
};

export const createSubtask = async (
    taskId: string,
    data: { title: string }
): Promise<Subtask> => {
    const response = await api.post(`/tasks/${taskId}/subtasks`, data);
    return response.data.data.subtask;
};

export const updateSubtask = async (
    subtaskId: string,
    data: { title?: string; completed?: boolean }
): Promise<Subtask> => {
    const response = await api.patch(`/subtasks/${subtaskId}`, data);
    return response.data.data.subtask;
};

export const deleteSubtask = async (subtaskId: string): Promise<void> => {
    await api.delete(`/subtasks/${subtaskId}`);
};
