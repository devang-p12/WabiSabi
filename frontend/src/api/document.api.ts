import { api } from "./client";

export type DocumentType = "PDF" | "DOCX" | "TXT" | "IMAGE" | "OTHER";
export type ProcessingStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface DocumentExtractedText {
    id: string;
    documentId: string;
    content: string;
    wordCount: number;
    characterCount: number;
    metadata?: Record<string, any>;
    extractedAt: string;
}

export interface DocumentItem {
    id: string;
    workspaceId: string;
    name: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    filePath: string;
    documentType: DocumentType;
    processingStatus: ProcessingStatus;
    errorMessage?: string | null;
    createdAt: string;
    updatedAt: string;
    extractedText?: DocumentExtractedText | null;
}

/**
 * Upload and ingest a document
 */
export async function uploadDocument(workspaceId: string, file: File): Promise<DocumentItem> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await api.post<{ success: boolean; data: DocumentItem }>(
        `/workspaces/${workspaceId}/documents`,
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }
    );
    return res.data.data;
}

/**
 * Get all documents for a workspace
 */
export async function getWorkspaceDocuments(workspaceId: string): Promise<DocumentItem[]> {
    const res = await api.get<{ success: boolean; data: DocumentItem[] }>(
        `/workspaces/${workspaceId}/documents`
    );
    return res.data.data;
}

/**
 * Get a single document with full extracted text
 */
export async function getDocument(documentId: string): Promise<DocumentItem> {
    const res = await api.get<{ success: boolean; data: DocumentItem }>(
        `/documents/${documentId}`
    );
    return res.data.data;
}

/**
 * Delete a document
 */
export async function deleteDocument(documentId: string): Promise<void> {
    await api.delete(`/documents/${documentId}`);
}
