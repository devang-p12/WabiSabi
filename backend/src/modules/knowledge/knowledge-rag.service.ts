import { prisma } from "../../config/prisma.js";
import { aiService } from "../ai/ai.service.js";
import { chunkText } from "./chunking.service.js";
import type { ChunkSourceType } from "../../generated/prisma/client.js";

export interface SemanticSearchResult {
    id: string;
    workspaceId: string;
    sourceType: ChunkSourceType;
    documentId: string | null;
    pageId: string | null;
    title: string;
    content: string;
    score: number;
    chunkIndex: number;
    metadata: Record<string, any>;
    createdAt: Date;
}

export class KnowledgeRagService {
    /**
     * Chunk and index an ingested document into pgvector
     */
    async indexDocument(documentId: string): Promise<number> {
        const doc = await prisma.document.findUnique({
            where: { id: documentId },
            include: { extractedText: true },
        });

        if (!doc || !doc.extractedText || !doc.extractedText.content.trim()) {
            return 0;
        }

        const text = doc.extractedText.content;
        const chunks = chunkText(text, { chunkSizeWords: 150, overlapWords: 30 });

        if (chunks.length === 0) return 0;

        // Delete any existing chunks for this document
        await prisma.knowledgeChunk.deleteMany({
            where: { documentId },
        });

        // Generate embeddings via AI provider in batches
        const chunkTexts = chunks.map((c) => c.content);
        let embeddings: number[][] = [];

        try {
            embeddings = await aiService.generateEmbeddings(chunkTexts);
        } catch (err) {
            console.warn("Embedding generation failed, falling back to empty embeddings:", err);
            embeddings = chunks.map(() => []);
        }

        // Insert new chunks
        await prisma.knowledgeChunk.createMany({
            data: chunks.map((c, idx) => ({
                workspaceId: doc.workspaceId,
                sourceType: "DOCUMENT",
                documentId: doc.id,
                chunkIndex: c.index,
                content: c.content,
                wordCount: c.wordCount,
                embedding: embeddings[idx] ?? [],
                metadata: {
                    documentName: doc.originalName,
                    documentType: doc.documentType,
                    fileSize: doc.fileSize,
                },
            })),
        });

        return chunks.length;
    }

    /**
     * Chunk and index a Wabi Page (combining title and block contents)
     */
    async indexPage(pageId: string): Promise<number> {
        const page = await prisma.page.findUnique({
            where: { id: pageId },
            include: {
                blocks: {
                    orderBy: { position: "asc" },
                },
            },
        });

        if (!page) return 0;

        // Assemble page text from blocks
        const blockTexts: string[] = [];
        if (page.title) blockTexts.push(`# ${page.title}`);

        for (const b of page.blocks) {
            const content = b.content as any;
            if (content && typeof content.text === "string" && content.text.trim()) {
                blockTexts.push(content.text.trim());
            }
        }

        const fullPageText = blockTexts.join("\n\n");
        if (!fullPageText.trim()) return 0;

        const chunks = chunkText(fullPageText, { chunkSizeWords: 150, overlapWords: 30 });
        if (chunks.length === 0) return 0;

        // Delete existing chunks for this page
        await prisma.knowledgeChunk.deleteMany({
            where: { pageId },
        });

        const chunkTexts = chunks.map((c) => c.content);
        let embeddings: number[][] = [];

        try {
            embeddings = await aiService.generateEmbeddings(chunkTexts);
        } catch (err) {
            console.warn("Embedding generation failed for page:", err);
            embeddings = chunks.map(() => []);
        }

        await prisma.knowledgeChunk.createMany({
            data: chunks.map((c, idx) => ({
                workspaceId: page.workspaceId,
                sourceType: "PAGE",
                pageId: page.id,
                chunkIndex: c.index,
                content: c.content,
                wordCount: c.wordCount,
                embedding: embeddings[idx] ?? [],
                metadata: {
                    pageTitle: page.title,
                    icon: page.icon || null,
                },
            })),
        });

        return chunks.length;
    }

    /**
     * Strict workspace-isolated semantic search using embeddings / cosine similarity
     */
    async semanticSearch(
        workspaceId: string,
        query: string,
        limit: number = 6
    ): Promise<SemanticSearchResult[]> {
        if (!query || !query.trim()) return [];

        let queryEmbedding: number[] = [];
        try {
            queryEmbedding = await aiService.generateEmbedding(query);
        } catch (err) {
            console.warn("Query embedding failed, falling back to lexical search:", err);
        }

        // If we have an embedding, query using PostgreSQL cosine_similarity SQL function
        if (queryEmbedding && queryEmbedding.length > 0) {
            const rawRows = await prisma.$queryRaw<
                Array<{
                    id: string;
                    workspaceId: string;
                    sourceType: ChunkSourceType;
                    documentId: string | null;
                    pageId: string | null;
                    chunkIndex: number;
                    content: string;
                    metadata: any;
                    createdAt: Date;
                    docName: string | null;
                    pageTitle: string | null;
                    score: number;
                }>
            >`
                SELECT 
                    kc.id,
                    kc."workspaceId",
                    kc."sourceType",
                    kc."documentId",
                    kc."pageId",
                    kc."chunkIndex",
                    kc.content,
                    kc.metadata,
                    kc."createdAt",
                    d."originalName" as "docName",
                    p.title as "pageTitle",
                    cosine_similarity(kc.embedding, ${queryEmbedding}::double precision[]) as score
                FROM "KnowledgeChunk" kc
                LEFT JOIN "Document" d ON kc."documentId" = d.id
                LEFT JOIN "Page" p ON kc."pageId" = p.id
                WHERE kc."workspaceId" = ${workspaceId}
                  AND cardinality(kc.embedding) > 0
                ORDER BY score DESC
                LIMIT ${limit};
            `;

            if (rawRows.length > 0 && rawRows[0] && rawRows[0].score > 0.05) {
                return rawRows.map((r) => ({
                    id: r.id,
                    workspaceId: r.workspaceId,
                    sourceType: r.sourceType,
                    documentId: r.documentId,
                    pageId: r.pageId,
                    title: r.sourceType === "DOCUMENT" ? (r.docName || "Document") : (r.pageTitle || "Page"),
                    content: r.content,
                    score: Math.round(Number(r.score) * 100) / 100,
                    chunkIndex: r.chunkIndex,
                    metadata: r.metadata || {},
                    createdAt: r.createdAt,
                }));
            }
        }

        // Fallback: Lexical text search over knowledge chunks for the workspace
        const words = query
            .toLowerCase()
            .split(/\s+/)
            .filter((w) => w.length > 2);

        const chunks = await prisma.knowledgeChunk.findMany({
            where: {
                workspaceId,
                ...(words.length > 0
                    ? {
                          OR: words.map((w) => ({
                              content: { contains: w, mode: "insensitive" as const },
                          })),
                      }
                    : {}),
            },
            include: {
                document: { select: { originalName: true } },
                page: { select: { title: true } },
            },
            take: limit * 2,
            orderBy: { createdAt: "desc" },
        });

        return chunks.slice(0, limit).map((c) => ({
            id: c.id,
            workspaceId: c.workspaceId,
            sourceType: c.sourceType,
            documentId: c.documentId,
            pageId: c.pageId,
            title:
                c.sourceType === "DOCUMENT"
                    ? (c.document?.originalName || "Document")
                    : (c.page?.title || "Page"),
            content: c.content,
            score: 0.75,
            chunkIndex: c.chunkIndex,
            metadata: (c.metadata as Record<string, any>) || {},
            createdAt: c.createdAt,
        }));
    }

    /**
     * Ask a RAG question grounded strictly on the workspace knowledge base
     */
    async askWorkspaceKnowledge(
        workspaceId: string,
        question: string
    ): Promise<{ answer: string; sources: SemanticSearchResult[] }> {
        const relevantChunks = await this.semanticSearch(workspaceId, question, 5);

        if (relevantChunks.length === 0) {
            return {
                answer: "I couldn't find any relevant documents or pages in this workspace discussing that topic.",
                sources: [],
            };
        }

        const contextSnippets = relevantChunks
            .map(
                (c, i) =>
                    `[Source ${i + 1} - ${c.sourceType}: "${c.title}"]\n${c.content}`
            )
            .join("\n\n---\n\n");

        const systemPrompt = `You are Wabi Knowledge Assistant.
Answer the user's question using ONLY the provided excerpts from their workspace documents and pages.
If the answer is not contained in the excerpts, state clearly that the workspace notes do not mention it.
Be concise, accurate, and reference the source names when helpful.`;

        const userPrompt = `Workspace Knowledge Context:
${contextSnippets}

User Question: ${question}

Provide an answer based strictly on the above knowledge context.`;

        try {
            const answer = await aiService.generateText(userPrompt, {
                systemPrompt,
                temperature: 0.2,
                timeoutMs: 60000,
            });

            return {
                answer: answer.trim(),
                sources: relevantChunks,
            };
        } catch (err: any) {
            console.error("RAG generation error:", err);
            return {
                answer: `Found ${relevantChunks.length} relevant sections in your workspace. (AI generation took too long or timed out).`,
                sources: relevantChunks,
            };
        }
    }
}

export const knowledgeRagService = new KnowledgeRagService();
