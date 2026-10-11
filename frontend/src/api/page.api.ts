import { api } from "./client";

export type BlockType =
    | "PARAGRAPH"
    | "HEADING_1"
    | "HEADING_2"
    | "HEADING_3"
    | "BULLETED_LIST"
    | "NUMBERED_LIST"
    | "TODO"
    | "QUOTE"
    | "CODE"
    | "DIVIDER"
    | "IMAGE"
    | "LINK"
    | "CALLOUT";

export interface BlockContent {
    text?: string;
    checked?: boolean; // for TODO
    language?: string; // for CODE
    url?: string; // for LINK, IMAGE
    caption?: string; // for IMAGE
    icon?: string; // for CALLOUT
    color?: string; // for CALLOUT
    [key: string]: any;
}

export interface Block {
    id: string;
    pageId: string;
    parentId?: string | null;
    type: BlockType;
    position: number;
    content: BlockContent;
    createdAt: string;
    updatedAt: string;
}

export interface Page {
    id: string;
    title: string;
    icon?: string | null;
    workspaceId: string;
    parentId?: string | null;
    position: number;
    createdAt: string;
    updatedAt: string;
    parent?: { id: string; title: string; icon?: string | null };
    children?: Page[];
    blocks?: Block[];
    _count?: {
        children: number;
        blocks: number;
    };
}

export interface CreatePageInput {
    title?: string;
    icon?: string | null;
    parentId?: string | null;
    position?: number;
}

export interface UpdatePageInput {
    title?: string;
    icon?: string | null;
    parentId?: string | null;
    position?: number;
}

export interface CreateBlockInput {
    type?: BlockType;
    parentId?: string | null;
    position?: number;
    content?: BlockContent;
}

export interface UpdateBlockInput {
    type?: BlockType;
    parentId?: string | null;
    position?: number;
    content?: BlockContent;
}

// ==========================================
// API Methods
// ==========================================

export const getWorkspacePages = async (workspaceId: string): Promise<Page[]> => {
    const res = await api.get<{ success: boolean; data: Page[] }>(
        `/workspaces/${workspaceId}/pages`
    );
    return res.data.data;
};

export const createPage = async (
    workspaceId: string,
    data: CreatePageInput
): Promise<Page> => {
    const res = await api.post<{ success: boolean; data: Page }>(
        `/workspaces/${workspaceId}/pages`,
        data
    );
    return res.data.data;
};

export const getPage = async (pageId: string): Promise<Page> => {
    const res = await api.get<{ success: boolean; data: Page }>(
        `/pages/${pageId}`
    );
    return res.data.data;
};

export const updatePage = async (
    pageId: string,
    data: UpdatePageInput
): Promise<Page> => {
    const res = await api.patch<{ success: boolean; data: Page }>(
        `/pages/${pageId}`,
        data
    );
    return res.data.data;
};

export const deletePage = async (pageId: string): Promise<void> => {
    await api.delete(`/pages/${pageId}`);
};

export const createBlock = async (
    pageId: string,
    data: CreateBlockInput
): Promise<Block> => {
    const res = await api.post<{ success: boolean; data: Block }>(
        `/pages/${pageId}/blocks`,
        data
    );
    return res.data.data;
};

export const updateBlock = async (
    blockId: string,
    data: UpdateBlockInput
): Promise<Block> => {
    const res = await api.patch<{ success: boolean; data: Block }>(
        `/blocks/${blockId}`,
        data
    );
    return res.data.data;
};

export const deleteBlock = async (blockId: string): Promise<void> => {
    await api.delete(`/blocks/${blockId}`);
};

export const batchSaveBlocks = async (
    pageId: string,
    blocks: Array<{
        id?: string;
        type: BlockType;
        position: number;
        parentId?: string | null;
        content: BlockContent;
    }>
): Promise<Block[]> => {
    const res = await api.put<{ success: boolean; data: Block[] }>(
        `/pages/${pageId}/blocks`,
        { blocks }
    );
    return res.data.data;
};
