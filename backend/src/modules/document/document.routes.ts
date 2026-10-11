import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import {
    documentUploadMiddleware,
    uploadDocumentController,
    getWorkspaceDocumentsController,
    getDocumentController,
    downloadDocumentController,
    deleteDocumentController,
} from "./document.controller.js";

const router = Router();

// Upload document to workspace
router.post(
    "/workspaces/:workspaceId/documents",
    authenticate,
    documentUploadMiddleware.single("file"),
    uploadDocumentController
);

// Get all documents in workspace
router.get(
    "/workspaces/:workspaceId/documents",
    authenticate,
    getWorkspaceDocumentsController
);

// Get single document with extracted text
router.get(
    "/documents/:documentId",
    authenticate,
    getDocumentController
);

// Download raw document file
router.get(
    "/documents/:documentId/download",
    authenticate,
    downloadDocumentController
);

// Delete document
router.delete(
    "/documents/:documentId",
    authenticate,
    deleteDocumentController
);

export default router;
