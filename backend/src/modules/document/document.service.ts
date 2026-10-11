import { prisma } from "../../config/prisma.js";
import { documentProcessingService } from "./document-processing.service.js";
import { knowledgeRagService } from "../knowledge/knowledge-rag.service.js";
import fs from "node:fs/promises";
import type { DocumentType } from "../../generated/prisma/client.js";

export interface CreateDocumentInput {
    workspaceId: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    filePath: string;
}

export class DocumentService {
    /**
     * Ingest and process a document file
     */
    async ingestDocument(input: CreateDocumentInput) {
        const docType: DocumentType = documentProcessingService.determineDocumentType(
            input.mimeType,
            input.originalName
        );

        // Create initial document record with PENDING status
        const document = await prisma.document.create({
            data: {
                workspaceId: input.workspaceId,
                name: input.originalName,
                originalName: input.originalName,
                mimeType: input.mimeType,
                fileSize: input.fileSize,
                filePath: input.filePath,
                documentType: docType,
                processingStatus: "PROCESSING",
            },
        });

        // Extract text asynchronously/in-line
        try {
            const extracted = await documentProcessingService.processDocument(
                input.filePath,
                input.originalName,
                input.mimeType
            );

            const cleanedText = extracted.text ? extracted.text.trim() : "";
            const wordCount = cleanedText.length > 0 ? cleanedText.split(/\s+/).length : 0;
            const characterCount = cleanedText.length;

            // Save extracted text separately from document metadata
            await prisma.documentExtractedText.create({
                data: {
                    documentId: document.id,
                    content: cleanedText,
                    wordCount,
                    characterCount,
                    metadata: extracted.metadata || {},
                },
            });

            // Update document status to COMPLETED
            const completedDoc = await prisma.document.update({
                where: { id: document.id },
                data: {
                    processingStatus: "COMPLETED",
                },
                include: {
                    extractedText: true,
                },
            });

            // Index document chunks into knowledge RAG in the background
            knowledgeRagService.indexDocument(document.id).catch((err) => {
                console.warn(`Failed to auto-index document ${document.id}:`, err);
            });

            return completedDoc;
        } catch (error: any) {
            console.error("Document text extraction failed:", error);

            // Record failure status
            const failedDoc = await prisma.document.update({
                where: { id: document.id },
                data: {
                    processingStatus: "FAILED",
                    errorMessage: error.message || "Failed to extract text",
                },
                include: {
                    extractedText: true,
                },
            });

            return failedDoc;
        }
    }

    /**
     * List all documents for a workspace
     */
    async getWorkspaceDocuments(workspaceId: string) {
        return prisma.document.findMany({
            where: { workspaceId },
            include: {
                extractedText: {
                    select: {
                        id: true,
                        wordCount: true,
                        characterCount: true,
                        extractedAt: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }

    /**
     * Get a specific document with extracted text
     */
    async getDocument(documentId: string) {
        return prisma.document.findUnique({
            where: { id: documentId },
            include: {
                extractedText: true,
            },
        });
    }

    /**
     * Delete document and physical file
     */
    async deleteDocument(documentId: string) {
        const doc = await prisma.document.findUnique({
            where: { id: documentId },
        });

        if (!doc) return null;

        // Try removing physical file
        try {
            await fs.unlink(doc.filePath);
        } catch {
            // Ignore if file doesn't exist on disk
        }

        return prisma.document.delete({
            where: { id: documentId },
        });
    }
}

export const documentService = new DocumentService();
