import type { DocumentExtractor, ExtractedDocumentResult } from "./extractor.interface.js";

/**
 * Image Extractor:
 * Prepares the architecture for OCR (e.g. Tesseract.js / Ollama vision)
 * without overcomplicating initial runtime requirements.
 * When OCR is not yet enabled, provides structured metadata identifying
 * the image file and notes that OCR extraction is pending/ready.
 */
export class ImageExtractor implements DocumentExtractor {
    supports(mimeType: string, filename: string): boolean {
        const lower = filename.toLowerCase();
        return (
            mimeType.startsWith("image/") ||
            lower.endsWith(".png") ||
            lower.endsWith(".jpg") ||
            lower.endsWith(".jpeg") ||
            lower.endsWith(".webp") ||
            lower.endsWith(".gif") ||
            lower.endsWith(".svg")
        );
    }

    async extract(_filePath: string, originalName: string, mimeType: string): Promise<ExtractedDocumentResult> {
        // Architecture ready for OCR engine plug-in
        return {
            text: `[Image: ${originalName} (${mimeType}) - OCR processing ready]`,
            metadata: {
                isImage: true,
                ocrStatus: "READY_FOR_OCR",
                note: "Architecture prepared for local OCR engine integration.",
            },
        };
    }
}
