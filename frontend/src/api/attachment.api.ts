import { api } from "./client";
import type { Task } from "./task.api";

export interface TaskAttachment {
    id: string;
    taskId: string;
    name: string;
    url: string;
    size: number;
    type: string;
    createdAt: string;
}

export function resolveAssetUrl(url?: string | null): string {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
        return url;
    }
    const host = typeof window !== "undefined" && window.location.hostname ? window.location.hostname : "localhost";
    return `http://${host}:3000${url.startsWith("/") ? url : `/${url}`}`;
}

export const getTaskAttachments = async (taskId: string): Promise<TaskAttachment[]> => {
    const res = await api.get<{ success: boolean; data: TaskAttachment[] }>(
        `/tasks/${taskId}/attachments`
    );
    return res.data.data;
};

export const uploadTaskAttachment = async (
    taskId: string,
    file: File
): Promise<TaskAttachment> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await api.post<{ success: boolean; data: TaskAttachment }>(
        `/tasks/${taskId}/attachments`,
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }
    );
    return res.data.data;
};

export const createUrlAttachment = async (
    taskId: string,
    data: { url: string; name?: string; type?: string }
): Promise<TaskAttachment> => {
    const res = await api.post<{ success: boolean; data: TaskAttachment }>(
        `/tasks/${taskId}/attachments`,
        data
    );
    return res.data.data;
};

export const deleteTaskAttachment = async (attachmentId: string): Promise<void> => {
    await api.delete(`/attachments/${attachmentId}`);
};

export const setTaskCover = async (
    taskId: string,
    coverUrl: string | null
): Promise<Task> => {
    const res = await api.patch<{ success: boolean; data: Task }>(
        `/tasks/${taskId}/cover`,
        { coverUrl }
    );
    return res.data.data;
};
