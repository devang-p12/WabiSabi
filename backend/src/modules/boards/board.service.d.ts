export declare const createBoard: (workspaceId: string, userId: string, data: {
    name: string;
    description?: string | undefined;
}) => Promise<{
    readonly error: "You do not have permission to create boards in this workspace.";
    readonly board?: never;
} | {
    readonly error: "Workspace not found.";
    readonly board?: never;
} | {
    readonly error?: never;
    readonly board: {
        id: string;
        name: string;
        description: string | null;
        workspaceId: string;
        createdAt: Date;
        updatedAt: Date;
    };
}>;
export declare const getWorkspaceBoards: (workspaceId: string, userId: string) => Promise<{
    readonly error: "You are not a member of this workspace.";
    readonly boards?: never;
} | {
    readonly error: "Workspace not found.";
    readonly boards?: never;
} | {
    readonly error?: never;
    readonly boards: {
        id: string;
        name: string;
        description: string | null;
        workspaceId: string;
        createdAt: Date;
        updatedAt: Date;
    }[];
}>;
export declare const getBoard: (boardId: string, userId: string) => Promise<{
    readonly board?: never;
    readonly error: "Board not found.";
} | {
    readonly board?: never;
    readonly error: "You do not have access to this board.";
} | {
    readonly error?: never;
    readonly board: {
        id: string;
        name: string;
        description: string | null;
        workspaceId: string;
        createdAt: Date;
        updatedAt: Date;
    };
}>;
export declare const updateBoard: (boardId: string, userId: string, data: {
    name?: string | undefined;
    description?: string | null | undefined;
}) => Promise<{
    readonly board?: never;
    readonly error: "Board not found.";
} | {
    readonly board?: never;
    readonly error: "You do not have permission to update this board.";
} | {
    readonly error?: never;
    readonly board: {
        id: string;
        name: string;
        description: string | null;
        workspaceId: string;
        createdAt: Date;
        updatedAt: Date;
    };
}>;
export declare const deleteBoard: (boardId: string, userId: string) => Promise<{
    readonly success?: never;
    readonly error: "Board not found.";
} | {
    readonly success?: never;
    readonly error: "You do not have permission to delete this board.";
} | {
    readonly error?: never;
    readonly success: true;
}>;
//# sourceMappingURL=board.service.d.ts.map