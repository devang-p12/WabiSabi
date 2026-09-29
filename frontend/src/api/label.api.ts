import { api } from "./client";

export interface Label {
    id: string;
    name: string;
    color: string;
    boardId: string;
    createdAt: string;
}

export interface CreateLabelInput {
    name: string;
    color: string;
}

export interface UpdateLabelInput {
    name?: string;
    color?: string;
}

// Get all labels for a board
export const getBoardLabels = async (
    boardId: string
): Promise<Label[]> => {
    const response = await api.get(
        `/boards/${boardId}/labels`
    );

    return response.data.data.labels;
};

// Create a label
export const createLabel = async (
    boardId: string,
    data: CreateLabelInput
): Promise<Label> => {
    const response = await api.post(
        `/boards/${boardId}/labels`,
        data
    );

    return response.data.data.label;
};

// Update a label
export const updateLabel = async (
    labelId: string,
    data: UpdateLabelInput
): Promise<Label> => {
    const response = await api.patch(
        `/labels/${labelId}`,
        data
    );

    return response.data.data.label;
};

// Delete a label
export const deleteLabel = async (
    labelId: string
): Promise<void> => {
    await api.delete(`/labels/${labelId}`);
};

// Add label to task
export const addLabelToTask = async (
    taskId: string,
    labelId: string
) => {
    const response = await api.post(
        `/tasks/${taskId}/labels/${labelId}`
    );

    return response.data.data.taskLabel;
};

// Remove label from task
export const removeLabelFromTask = async (
    taskId: string,
    labelId: string
): Promise<void> => {
    await api.delete(
        `/tasks/${taskId}/labels/${labelId}`
    );
};