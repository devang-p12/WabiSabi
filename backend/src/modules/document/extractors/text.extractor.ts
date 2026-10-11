import fs from "node:fs/promises";
import type { DocumentExtractor, ExtractedDocumentResult } from "./extractor.interface.js";

export class TextExtractor implements DocumentExtractor {
    supports(mimeType: string, filename: string): boolean {
        const lower = filename.toLowerCase();
        return (
            mimeType.startsWith("text/") ||
            lower.endsWith(".txt") ||
            lower.endsWith(".md") ||
            lower.endsWith(".csv") ||
            lower.endsWith(".json") ||
            lower.endsWith(".log")
        );
    }

    async extract(filePath: string): Promise<ExtractedDocumentResult> {
        const content = await fs.readFile(filePath, "utf-8");
        return {
            text: content,
            metadata: {
                encoding: "utf-8",
                type: "plain_text",
            },
        };
    }
}
