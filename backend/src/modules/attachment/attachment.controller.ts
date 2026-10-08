import type { Response } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import {
    createAttachment,
    deleteAttachment,
    getTaskAttachments,
    setTaskCover,
} from "./attachment.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, "../../../uploads");

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    },
});

export const uploadMiddleware = multer({
    storage,
    limits: {
        fileSize: 20 * 1024 * 1024, // 20 MB max file size
    },
});

export const getTaskAttachmentsController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const taskId = req.params.taskId as string;
    const attachments = await getTaskAttachments(taskId);
    res.json({ success: true, data: attachments });
};

export const createAttachmentController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const taskId = req.params.taskId as string;

    // Check if multipart file uploaded
    if (req.file) {
        const url = `/uploads/${req.file.filename}`;
        const attachment = await createAttachment(taskId, {
            name: req.file.originalname,
            url,
            size: req.file.size,
            type: req.file.mimetype,
        });

        res.status(201).json({ success: true, data: attachment });
        return;
    }

    // Otherwise check for JSON URL attachment
    const { url, name, size, type } = req.body;
    if (!url || typeof url !== "string") {
        res.status(400).json({ success: false, message: "File or attachment URL is required." });
        return;
    }

    const attachment = await createAttachment(taskId, {
        name: name || "Attachment",
        url,
        size: typeof size === "number" ? size : 0,
        type: type || (url.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) ? "image/jpeg" : "application/octet-stream"),
    });

    res.status(201).json({ success: true, data: attachment });
};

export const deleteAttachmentController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const attachmentId = req.params.attachmentId as string;
    const success = await deleteAttachment(attachmentId);

    if (!success) {
        res.status(404).json({ success: false, message: "Attachment not found." });
        return;
    }

    res.json({ success: true, message: "Attachment deleted." });
};

export const setTaskCoverController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const taskId = req.params.taskId as string;
    const { coverUrl } = req.body;

    const task = await setTaskCover(taskId, coverUrl ?? null);
    res.json({ success: true, data: task });
};
