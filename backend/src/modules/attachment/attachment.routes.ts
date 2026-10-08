import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import {
    createAttachmentController,
    deleteAttachmentController,
    getTaskAttachmentsController,
    setTaskCoverController,
    uploadMiddleware,
} from "./attachment.controller.js";

const router = Router();

router.get("/tasks/:taskId/attachments", authenticate, getTaskAttachmentsController);
router.post(
    "/tasks/:taskId/attachments",
    authenticate,
    uploadMiddleware.single("file"),
    createAttachmentController
);
router.delete("/attachments/:attachmentId", authenticate, deleteAttachmentController);
router.patch("/tasks/:taskId/cover", authenticate, setTaskCoverController);

export default router;
