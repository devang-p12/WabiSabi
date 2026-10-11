import { api } from "./client";

export type ChunkSourceType = "DOCUMENT" | "PAGE";

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
    createdAt: string;
}

export interface WorkspaceRagAnswer {
    answer: string;
    sources: SemanticSearchResult[];
}

/**
 * Execute semantic search over workspace knowledge
 */
export async function searchWorkspaceKnowledge(
    workspaceId: string,
    query: string,
    limit: number = 6
): Promise<SemanticSearchResult[]> {
    const res = await api.get<{ success: boolean; data: SemanticSearchResult[] }>(
        `/workspaces/${workspaceId}/knowledge/search`,
        {
            params: { q: query, limit },
        }
    );
    return res.data.data;
}

/**
 * Ask grounded RAG question to workspace knowledge base
 */
export async function askWorkspaceKnowledge(
    workspaceId: string,
    question: string
): Promise<WorkspaceRagAnswer> {
    const res = await api.post<{ success: boolean; data: WorkspaceRagAnswer }>(
        `/workspaces/${workspaceId}/knowledge/ask`,
        { question }
    );
    return res.data.data;
}

/**
 * Trigger manual indexing for a document or page
 */
export async function indexKnowledgeResource(
    workspaceId: string,
    payload: { documentId?: string; pageId?: string }
): Promise<{ chunkCount: number }> {
    const res = await api.post<{ success: boolean; data: { chunkCount: number } }>(
        `/workspaces/${workspaceId}/knowledge/index`,
        payload
    );
    return res.data.data;
}
