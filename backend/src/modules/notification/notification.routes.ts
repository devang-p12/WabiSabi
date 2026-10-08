import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import {
    getNotificationsController,
    markReadController,
    markAllReadController,
    deleteNotificationController,
} from "./notification.controller.js";

const router = Router();

router.get("/", authenticate, getNotificationsController);
router.patch("/:notificationId/read", authenticate, markReadController);
router.post("/read-all", authenticate, markAllReadController);
router.delete("/:notificationId", authenticate, deleteNotificationController);

export default router;
