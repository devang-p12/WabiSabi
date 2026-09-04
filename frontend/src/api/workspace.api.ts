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


export interface WorkspaceMember {
    userId: string;
    role: "OWNER" | "ADMIN" | "MEMBER";
    createdAt: string;
    user: {
        id: string;
        name: string;
        email: string;
        avatarUrl: string | null;
    };
}

export const getWorkspace = async (
    workspaceId: string
) => {
    const response = await api.get<{
        success: boolean;
        data: {
            workspace: Workspace;
        };
    }>(`/workspaces/${workspaceId}`);

    return response.data.data.workspace;
};

export const getWorkspaceMembers = async (
    workspaceId: string
) => {
    const response = await api.get<{
        success: boolean;
        data: {
            members: WorkspaceMember[];
        };
    }>(`/workspaces/${workspaceId}/members`);

    return response.data.data.members;
};


export interface AddWorkspaceMemberInput {
    email: string;
    role?: "ADMIN" | "MEMBER";
}

export const addWorkspaceMember = async (
    workspaceId: string,
    data: AddWorkspaceMemberInput
) => {
    const response = await api.post<{
        success: boolean;
        data: {
            member: WorkspaceMember;
        };
    }>(`/workspaces/${workspaceId}/members`, data);

    return response.data.data.member;
};

export const updateWorkspaceMember = async (
    workspaceId: string,
    userId: string,
    role: "ADMIN" | "MEMBER"
) => {
    const response = await api.patch<{
        success: boolean;
        data: {
            member: WorkspaceMember;
        };
    }>(`/workspaces/${workspaceId}/members/${userId}`, {
        role,
    });

    return response.data.data.member;
};

export const removeWorkspaceMember = async (
    workspaceId: string,
    userId: string
) => {
    await api.delete(
        `/workspaces/${workspaceId}/members/${userId}`
    );
};