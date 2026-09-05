import { api } from "./client";

export interface Board {
    id: string;
    name: string;
    description: string | null;
    workspaceId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateBoardInput {
    name: string;
    description?: string;
}

export interface UpdateBoardInput {
    name?: string;
    description?: string | null;
}

export const getWorkspaceBoards = async (
    workspaceId: string
): Promise<Board[]> => {
    const response = await api.get(
        `/workspaces/${workspaceId}/boards`
    );

    return response.data.data.boards;
};

export const getBoard = async (
    boardId: string
): Promise<Board> => {
    const response = await api.get(`/boards/${boardId}`);

    return response.data.data.board;
};

export const createBoard = async (
    workspaceId: string,
    data: CreateBoardInput
): Promise<Board> => {
    const response = await api.post(
        `/workspaces/${workspaceId}/boards`,
        data
    );

    return response.data.data.board;
};

export const updateBoard = async (
    boardId: string,
    data: UpdateBoardInput
): Promise<Board> => {
    const response = await api.patch(
        `/boards/${boardId}`,
        data
    );

    return response.data.data.board;
};

export const deleteBoard = async (
    boardId: string
): Promise<void> => {
    await api.delete(`/boards/${boardId}`);
};