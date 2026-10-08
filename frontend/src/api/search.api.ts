import { api } from "./client";

export interface SearchWorkspaceResult {
    id: string;
    name: string;
    description?: string | null;
}

export interface SearchBoardResult {
    id: string;
    name: string;
    description?: string | null;
    workspaceId: string;
    workspace?: {
        id: string;
        name: string;
    };
}

export interface SearchTaskResult {
    id: string;
    title: string;
    description?: string | null;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    completed: boolean;
    dueDate?: string | null;
    list: {
        id: string;
        name: string;
        board: {
            id: string;
            name: string;
            workspaceId: string;
        };
    };
    assignee?: {
        id: string;
        name: string;
        avatarUrl?: string | null;
    } | null;
}

export interface GlobalSearchResult {
    workspaces: SearchWorkspaceResult[];
    boards: SearchBoardResult[];
    tasks: SearchTaskResult[];
}

export const searchGlobal = async (query: string): Promise<GlobalSearchResult> => {
    if (!query.trim()) {
        return {
            workspaces: [],
            boards: [],
            tasks: [],
        };
    }

    const res = await api.get<{ success: boolean; data: GlobalSearchResult }>(
        `/search?q=${encodeURIComponent(query.trim())}`
    );
    return res.data.data;
};
