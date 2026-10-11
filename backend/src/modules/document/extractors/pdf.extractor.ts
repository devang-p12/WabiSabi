import fs from "node:fs/promises";
// @ts-ignore - pdf-parse-fork types
import pdfParse from "pdf-parse-fork";
import type { DocumentExtractor, ExtractedDocumentResult } from "./extractor.interface.js";

export class PdfExtractor implements DocumentExtractor {
    supports(mimeType: string, filename: string): boolean {
        return (
            mimeType === "application/pdf" ||
            filename.toLowerCase().endsWith(".pdf")
        );
    }

    async extract(filePath: string): Promise<ExtractedDocumentResult> {
        const dataBuffer = await fs.readFile(filePath);
        const data = await pdfParse(dataBuffer);

        return {
            text: data.text ? data.text.trim() : "",
            metadata: {
                totalPages: data.numpages,
                info: data.info || {},
                version: data.version,
            },
        };
    }
}
