import type { DocumentExtractor, ExtractedDocumentResult } from "./extractors/extractor.interface.js";
import { TextExtractor } from "./extractors/text.extractor.js";
import { PdfExtractor } from "./extractors/pdf.extractor.js";
import { DocxExtractor } from "./extractors/docx.extractor.js";
import { ImageExtractor } from "./extractors/image.extractor.js";
import type { DocumentType } from "../../generated/prisma/client.js";

export class DocumentProcessingService {
    private extractors: DocumentExtractor[] = [
        new TextExtractor(),
        new PdfExtractor(),
        new DocxExtractor(),
        new ImageExtractor(),
    ];

    /**
     * Determine DocumentType enum based on MIME type and filename
     */
    determineDocumentType(mimeType: string, filename: string): DocumentType {
        const lower = filename.toLowerCase();
        if (mimeType === "application/pdf" || lower.endsWith(".pdf")) {
            return "PDF";
        }
        if (
            mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            mimeType === "application/msword" ||
            lower.endsWith(".docx") ||
            lower.endsWith(".doc")
        ) {
            return "DOCX";
        }
        if (
            mimeType.startsWith("text/") ||
            lower.endsWith(".txt") ||
            lower.endsWith(".md") ||
            lower.endsWith(".csv") ||
            lower.endsWith(".json")
        ) {
            return "TXT";
        }
        if (
            mimeType.startsWith("image/") ||
            lower.endsWith(".png") ||
            lower.endsWith(".jpg") ||
            lower.endsWith(".jpeg") ||
            lower.endsWith(".webp") ||
            lower.endsWith(".gif")
        ) {
            return "IMAGE";
        }
        return "OTHER";
    }

    /**
     * Process and extract text from a file
     */
    async processDocument(
        filePath: string,
        originalName: string,
        mimeType: string
    ): Promise<ExtractedDocumentResult> {
        for (const extractor of this.extractors) {
            if (extractor.supports(mimeType, originalName)) {
                return await extractor.extract(filePath, originalName, mimeType);
            }
        }

        // Fallback for unsupported formats
        return {
            text: `[Unsupported format: ${originalName}]`,
            metadata: {
                unsupported: true,
                mimeType,
            },
        };
    }
}

export const documentProcessingService = new DocumentProcessingService();
