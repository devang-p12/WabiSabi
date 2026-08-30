import { api } from "./client";

export interface Workspace {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateWorkspaceInput {
    name: string;
    description?: string;
}

export interface UpdateWorkspaceInput {
    name?: string;
    description?: string | null;
}

export const getWorkspaces = async () => {
    const response = await api.get<{
        success: boolean;
        data: {
            workspaces: Workspace[];
        };
    }>("/workspaces");

    return response.data.data.workspaces;
};

export const createWorkspace = async (
    data: CreateWorkspaceInput
) => {
    const response = await api.post<{
        success: boolean;
        data: {
            workspace: Workspace;
        };
    }>("/workspaces", data);

    return response.data.data.workspace;
};

export const updateWorkspace = async (
    workspaceId: string,
    data: UpdateWorkspaceInput
) => {
    const response = await api.patch<{
        success: boolean;
        data: {
            workspace: Workspace;
        };
    }>(`/workspaces/${workspaceId}`, data);

    return response.data.data.workspace;
};

export const deleteWorkspace = async (
    workspaceId: string
) => {
    await api.delete(`/workspaces/${workspaceId}`);
};