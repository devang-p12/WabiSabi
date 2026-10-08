import { prisma } from "../../config/prisma.js";
import { getIO } from "../../socket.js";
import type { NotificationType } from "../../generated/prisma/client.js";

export interface CreateNotificationParams {
    userId: string;
    actorId?: string | null | undefined;
    type: NotificationType;
    title: string;
    message: string;
    taskId?: string | null | undefined;
    boardId?: string | null | undefined;
    workspaceId?: string | null | undefined;
}

export const createNotification = async (params: CreateNotificationParams) => {
    // Don't send notification to self
    if (params.actorId && params.actorId === params.userId) {
        return null;
    }

    const notification = await prisma.notification.create({
        data: {
            userId: params.userId,
            actorId: params.actorId ?? null,
            type: params.type,
            title: params.title,
            message: params.message,
            taskId: params.taskId ?? null,
            boardId: params.boardId ?? null,
            workspaceId: params.workspaceId ?? null,
        },
        include: {
            actor: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                },
            },
        },
    });

    try {
        getIO().to(`user_${params.userId}`).emit("new_notification", notification);
    } catch (e) {
        console.error("Failed to emit notification socket event:", e);
    }

    return notification;
};

export const getUserNotifications = async (userId: string, limit = 50) => {
    const [notifications, unreadCount] = await Promise.all([
        prisma.notification.findMany({
            where: { userId },
            include: {
                actor: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: limit,
        }),
        prisma.notification.count({
            where: { userId, read: false },
        }),
    ]);

    return { notifications, unreadCount };
};

export const markNotificationRead = async (userId: string, notificationId: string) => {
    const notification = await prisma.notification.findFirst({
        where: { id: notificationId, userId },
    });
    if (!notification) return null;

    return await prisma.notification.update({
        where: { id: notificationId },
        data: { read: true },
        include: {
            actor: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                },
            },
        },
    });
};

export const markAllNotificationsRead = async (userId: string) => {
    await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
    });
    return { success: true };
};

export const deleteNotification = async (userId: string, notificationId: string) => {
    const notification = await prisma.notification.findFirst({
        where: { id: notificationId, userId },
    });
    if (!notification) return false;

    await prisma.notification.delete({
        where: { id: notificationId },
    });
    return true;
};
