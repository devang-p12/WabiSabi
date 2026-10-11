export interface ExtractedDocumentResult {
    text: string;
    metadata?: Record<string, any>;
}

export interface DocumentExtractor {
    supports(mimeType: string, filename: string): boolean;
    extract(filePath: string, originalName: string, mimeType: string): Promise<ExtractedDocumentResult>;
}
