import type { Response } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { documentService } from "./document.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const documentsUploadDir = path.resolve(__dirname, "../../../uploads/documents");

if (!fs.existsSync(documentsUploadDir)) {
    fs.mkdirSync(documentsUploadDir, { recursive: true });
}

// Multer storage for documents
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, documentsUploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    },
});

export const documentUploadMiddleware = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max file size
    },
});

/**
 * Upload and ingest document
 */
export const uploadDocumentController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        const workspaceId = req.params.workspaceId as string;

        if (!req.file) {
            res.status(400).json({
                success: false,
                message: "No file was uploaded",
            });
            return;
        }

        const document = await documentService.ingestDocument({
            workspaceId,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            fileSize: req.file.size,
            filePath: req.file.path,
        });

        res.status(201).json({
            success: true,
            data: document,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to upload and ingest document",
        });
    }
};

/**
 * List documents for workspace
 */
export const getWorkspaceDocumentsController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        const workspaceId = req.params.workspaceId as string;
        const documents = await documentService.getWorkspaceDocuments(workspaceId);

        res.json({
            success: true,
            data: documents,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch documents",
        });
    }
};

/**
 * Get single document details with extracted text
 */
export const getDocumentController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        const documentId = req.params.documentId as string;
        const document = await documentService.getDocument(documentId);

        if (!document) {
            res.status(404).json({
                success: false,
                message: "Document not found",
            });
            return;
        }

        res.json({
            success: true,
            data: document,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch document",
        });
    }
};

/**
 * Download original file
 */
export const downloadDocumentController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        const documentId = req.params.documentId as string;
        const document = await documentService.getDocument(documentId);

        if (!document || !fs.existsSync(document.filePath)) {
            res.status(404).json({
                success: false,
                message: "File not found",
            });
            return;
        }

        res.download(document.filePath, document.originalName);
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to download document",
        });
    }
};

/**
 * Delete document
 */
export const deleteDocumentController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        const documentId = req.params.documentId as string;
        await documentService.deleteDocument(documentId);

        res.json({
            success: true,
            message: "Document deleted successfully",
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to delete document",
        });
    }
};
