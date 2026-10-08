export declare const createList: (boardId: string, userId: string, data: {
    name: string;
}) => Promise<{
    readonly error: "Board not found.";
    readonly list?: never;
} | {
    readonly error: "You do not have permission to create lists in this board.";
    readonly list?: never;
} | {
    readonly error?: never;
    readonly list: {
        id: string;
        name: string;
        position: number;
        boardId: string;
        createdAt: Date;
        updatedAt: Date;
    };
}>;
export declare const getBoardLists: (boardId: string, userId: string) => Promise<{
    readonly error: "Board not found.";
    readonly lists?: never;
} | {
    readonly error: "You are not a member of this workspace.";
    readonly lists?: never;
} | {
    readonly error?: never;
    readonly lists: {
        id: string;
        name: string;
        position: number;
        boardId: string;
        createdAt: Date;
        updatedAt: Date;
    }[];
}>;
export declare const updateList: (listId: string, userId: string, data: {
    name?: string;
}) => Promise<{
    readonly list?: never;
    readonly error: "List not found.";
} | {
    readonly list?: never;
    readonly error: "You do not have permission to update this list.";
} | {
    readonly error?: never;
    readonly list: {
        id: string;
        name: string;
        position: number;
        boardId: string;
        createdAt: Date;
        updatedAt: Date;
    };
}>;
export declare const deleteList: (listId: string, userId: string) => Promise<{
    readonly success?: never;
    readonly error: "List not found.";
} | {
    readonly success?: never;
    readonly error: "You do not have permission to delete this list.";
} | {
    readonly error?: never;
    readonly success: true;
}>;
//# sourceMappingURL=list.service.d.ts.map