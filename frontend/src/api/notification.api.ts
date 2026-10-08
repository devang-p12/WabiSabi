import { api } from "./client";

export type NotificationType =
    | "TASK_ASSIGNED"
    | "TASK_COMMENT"
    | "TASK_MENTION"
    | "TASK_DUE_SOON";

export interface NotificationActor {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
}

export interface AppNotification {
    id: string;
    userId: string;
    actorId?: string | null;
    type: NotificationType;
    title: string;
    message: string;
    read: boolean;
    taskId?: string | null;
    boardId?: string | null;
    workspaceId?: string | null;
    createdAt: string;
    updatedAt: string;
    actor?: NotificationActor | null;
}

export interface NotificationsResponseData {
    notifications: AppNotification[];
    unreadCount: number;
}

export const getNotifications = async (limit = 50): Promise<NotificationsResponseData> => {
    const res = await api.get<{ success: boolean; data: NotificationsResponseData }>(
        `/notifications?limit=${limit}`
    );
    return res.data.data;
};

export const markNotificationRead = async (notificationId: string): Promise<AppNotification> => {
    const res = await api.patch<{ success: boolean; data: AppNotification }>(
        `/notifications/${notificationId}/read`
    );
    return res.data.data;
};

export const markAllNotificationsRead = async (): Promise<void> => {
    await api.post(`/notifications/read-all`);
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
    await api.delete(`/notifications/${notificationId}`);
};
