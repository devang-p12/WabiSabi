export interface TextChunk {
    index: number;
    content: string;
    wordCount: number;
    characterCount: number;
    metadata?: Record<string, any>;
}

export interface ChunkingOptions {
    chunkSizeWords?: number; // e.g. 150-250 words
    overlapWords?: number;   // e.g. 30 words
}

/**
 * Clean, lightweight sliding-window document chunker.
 * Keeps chunks cohesive across paragraph boundaries.
 */
export function chunkText(text: string, options?: ChunkingOptions): TextChunk[] {
    const chunkSize = options?.chunkSizeWords ?? 200;
    const overlap = options?.overlapWords ?? 40;

    if (!text || !text.trim()) {
        return [];
    }

    // Split text into paragraphs
    const paragraphs = text
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

    const chunks: TextChunk[] = [];
    let currentWords: string[] = [];
    let chunkIndex = 0;

    for (const para of paragraphs) {
        const words = para.split(/\s+/).filter((w) => w.length > 0);
        if (words.length === 0) continue;

        // If adding this paragraph exceeds chunkSize and we already have words, emit current chunk
        if (currentWords.length + words.length > chunkSize && currentWords.length > 0) {
            const chunkContent = currentWords.join(" ");
            chunks.push({
                index: chunkIndex++,
                content: chunkContent,
                wordCount: currentWords.length,
                characterCount: chunkContent.length,
            });

            // Slide window retaining overlap
            const keepCount = Math.min(overlap, currentWords.length);
            currentWords = currentWords.slice(currentWords.length - keepCount);
        }

        // If a single paragraph is larger than chunkSize, break it into pieces
        if (words.length > chunkSize) {
            let start = 0;
            while (start < words.length) {
                const slice = words.slice(start, start + chunkSize);
                currentWords.push(...slice);

                if (currentWords.length >= chunkSize) {
                    const chunkContent = currentWords.join(" ");
                    chunks.push({
                        index: chunkIndex++,
                        content: chunkContent,
                        wordCount: currentWords.length,
                        characterCount: chunkContent.length,
                    });
                    const keepCount = Math.min(overlap, currentWords.length);
                    currentWords = currentWords.slice(currentWords.length - keepCount);
                }
                start += chunkSize;
            }
        } else {
            currentWords.push(...words);
        }
    }

    // Emit final chunk if words remain
    if (currentWords.length > 0) {
        const chunkContent = currentWords.join(" ");
        chunks.push({
            index: chunkIndex++,
            content: chunkContent,
            wordCount: currentWords.length,
            characterCount: chunkContent.length,
        });
    }

    return chunks;
}
