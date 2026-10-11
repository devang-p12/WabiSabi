import mammoth from "mammoth";
import type { DocumentExtractor, ExtractedDocumentResult } from "./extractor.interface.js";

export class DocxExtractor implements DocumentExtractor {
    supports(mimeType: string, filename: string): boolean {
        const lower = filename.toLowerCase();
        return (
            mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            mimeType === "application/msword" ||
            lower.endsWith(".docx") ||
            lower.endsWith(".doc")
        );
    }

    async extract(filePath: string): Promise<ExtractedDocumentResult> {
        const result = await mammoth.extractRawText({ path: filePath });

        return {
            text: result.value ? result.value.trim() : "",
            metadata: {
                messagesCount: result.messages.length,
                messages: result.messages.slice(0, 5),
            },
        };
    }
}
