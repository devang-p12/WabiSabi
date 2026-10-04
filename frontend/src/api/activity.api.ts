import { api } from "./client";
import type { CommentAuthor } from "./comment.api";

export interface ActivityLog {
    id: string;
    action: "CREATE" | "UPDATE" | "DELETE" | "MOVE";
    entityType: "TASK" | "LIST" | "BOARD";
    entityId: string;
    entityTitle: string;
    userId: string;
    createdAt: string;
    boardId?: string;
    taskId?: string;
    user: CommentAuthor;
}

export const activityApi = {
    getTaskActivity: async (taskId: string) => {
        const response = await api.get<{ success: boolean; data: ActivityLog[] }>(
            `/tasks/${taskId}/activity`
        );
        return response.data.data;
    },
    getBoardActivity: async (boardId: string) => {
        const response = await api.get<{ success: boolean; data: ActivityLog[] }>(
            `/boards/${boardId}/activity`
        );
        return response.data.data;
    },
};
