interface CreateWorkspaceInput {
    name: string;
    description?: string | undefined;
}
interface UpdateWorkspaceInput {
    name?: string | undefined;
    description?: string | null | undefined;
}
export declare const createWorkspace: (userId: string, data: CreateWorkspaceInput) => Promise<{
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare const getUserWorkspaces: (userId: string) => Promise<({
    members: {
        role: import("../../generated/prisma/enums.js").WorkspaceRole;
        userId: string;
    }[];
} & {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
})[]>;
export declare const getWorkspaceById: (workspaceId: string, userId: string) => Promise<({
    members: {
        role: import("../../generated/prisma/enums.js").WorkspaceRole;
        userId: string;
    }[];
} & {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
}) | null>;
export declare const updateWorkspace: (workspaceId: string, data: UpdateWorkspaceInput) => Promise<{
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare const deleteWorkspace: (workspaceId: string) => Promise<{
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare const getWorkspaceMembers: (workspaceId: string) => Promise<{
    createdAt: Date;
    role: import("../../generated/prisma/enums.js").WorkspaceRole;
    user: {
        avatarUrl: string | null;
        email: string;
        id: string;
        name: string;
    };
    userId: string;
}[]>;
interface AddWorkspaceMemberInput {
    email: string;
    role: "ADMIN" | "MEMBER";
}
export declare const addWorkspaceMember: (workspaceId: string, data: AddWorkspaceMemberInput) => Promise<{
    readonly error: "USER_NOT_FOUND";
    readonly member?: never;
} | {
    readonly error: "ALREADY_MEMBER";
    readonly member?: never;
} | {
    readonly error?: never;
    readonly member: {
        createdAt: Date;
        role: import("../../generated/prisma/enums.js").WorkspaceRole;
        user: {
            avatarUrl: string | null;
            email: string;
            id: string;
            name: string;
        };
        userId: string;
    };
}>;
interface UpdateWorkspaceMemberInput {
    role: "ADMIN" | "MEMBER";
}
export declare const updateWorkspaceMember: (workspaceId: string, userId: string, data: UpdateWorkspaceMemberInput) => Promise<{
    readonly member?: never;
    readonly error: "MEMBER_NOT_FOUND";
} | {
    readonly member?: never;
    readonly error: "OWNER_CANNOT_BE_MODIFIED";
} | {
    readonly error?: never;
    readonly member: {
        createdAt: Date;
        role: import("../../generated/prisma/enums.js").WorkspaceRole;
        user: {
            avatarUrl: string | null;
            email: string;
            id: string;
            name: string;
        };
        userId: string;
    };
}>;
export declare const removeWorkspaceMember: (workspaceId: string, userId: string) => Promise<{
    readonly error: "MEMBER_NOT_FOUND";
    readonly success?: never;
} | {
    readonly error: "OWNER_CANNOT_BE_REMOVED";
    readonly success?: never;
} | {
    readonly error?: never;
    readonly success: true;
}>;
export {};
//# sourceMappingURL=workspace.service.d.ts.map