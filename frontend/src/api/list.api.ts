import { api } from "./client";

export interface BoardList {
    id: string;
    name: string;
    position: number;
    boardId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateListInput {
    name: string;
}

export interface UpdateListInput {
    name?: string;
}

export const getBoardLists = async (
    boardId: string
): Promise<BoardList[]> => {
    const response = await api.get(`/boards/${boardId}/lists`);
    return response.data.data.lists;
};

export const createList = async (
    boardId: string,
    data: CreateListInput
): Promise<BoardList> => {
    const response = await api.post(
        `/boards/${boardId}/lists`,
        data
    );

    return response.data.data.list;
};

export const updateList = async (
    listId: string,
    data: UpdateListInput
): Promise<BoardList> => {
    const response = await api.patch(
        `/lists/${listId}`,
        data
    );

    return response.data.data.list;
};

export const deleteList = async (
    listId: string
): Promise<void> => {
    await api.delete(`/lists/${listId}`);
};