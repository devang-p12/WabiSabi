import { api } from "./client";

export interface CommentAuthor {
    id: string;
    name: string;
    avatarUrl: string | null;
}

export interface TaskComment {
    id: string;
    text: string;
    taskId: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    user: CommentAuthor;
}

export const commentApi = {
    getTaskComments: async (taskId: string) => {
        const response = await api.get<{ success: boolean; data: TaskComment[] }>(
            `/tasks/${taskId}/comments`
        );
        return response.data.data;
    },
    createComment: async (taskId: string, text: string) => {
        const response = await api.post<{ success: boolean; data: TaskComment }>(
            `/tasks/${taskId}/comments`,
            { text }
        );
        return response.data.data;
    },
    deleteComment: async (commentId: string) => {
        const response = await api.delete<{ success: boolean; message: string }>(
            `/comments/${commentId}`
        );
        return response.data.success;
    },
};
