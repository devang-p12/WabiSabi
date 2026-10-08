import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import {
    getUserNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
} from "./notification.service.js";

export const getNotificationsController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const userId = req.userId;
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const result = await getUserNotifications(userId, limit);

    res.json({
        success: true,
        data: result,
    });
};

export const markReadController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const userId = req.userId;
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }

    const notificationId = req.params.notificationId as string;
    const updated = await markNotificationRead(userId, notificationId);

    if (!updated) {
        res.status(404).json({ success: false, message: "Notification not found." });
        return;
    }

    res.json({
        success: true,
        data: updated,
    });
};

export const markAllReadController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const userId = req.userId;
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }

    await markAllNotificationsRead(userId);

    res.json({
        success: true,
        message: "All notifications marked as read.",
    });
};

export const deleteNotificationController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const userId = req.userId;
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }

    const notificationId = req.params.notificationId as string;
    const success = await deleteNotification(userId, notificationId);

    if (!success) {
        res.status(404).json({ success: false, message: "Notification not found." });
        return;
    }

    res.json({
        success: true,
        message: "Notification deleted.",
    });
};
