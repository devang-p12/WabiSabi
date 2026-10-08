export declare const createTask: (listId: string, userId: string, data: {
    title: string;
    description?: string | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    dueDate?: string | null | undefined;
    assigneeId?: string | null | undefined;
}) => Promise<{
    readonly error: "List not found.";
    readonly task?: never;
} | {
    readonly error: "You are not a member of this workspace.";
    readonly task?: never;
} | {
    readonly error?: never;
    readonly task: {
        assignee: {
            avatarUrl: string | null;
            email: string;
            id: string;
            name: string;
        } | null;
        labels: ({
            label: {
                id: string;
                name: string;
                color: string;
                boardId: string;
                createdAt: Date;
            };
        } & {
            taskId: string;
            labelId: string;
        })[];
        subtasks: {
            id: string;
            title: string;
            completed: boolean;
            taskId: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
    } & {
        id: string;
        title: string;
        description: string | null;
        position: number;
        listId: string;
        priority: import("../../generated/prisma/enums.js").TaskPriority;
        dueDate: Date | null;
        completed: boolean;
        createdAt: Date;
        updatedAt: Date;
        assigneeId: string | null;
    };
}>;
export declare const getListTasks: (listId: string, userId: string) => Promise<{
    readonly error: "List not found.";
    readonly tasks?: never;
} | {
    readonly error: "You are not a member of this workspace.";
    readonly tasks?: never;
} | {
    readonly error?: never;
    readonly tasks: {
        id: string;
        title: string;
        description: string | null;
        position: number;
        listId: string;
        priority: import("../../generated/prisma/enums.js").TaskPriority;
        dueDate: Date | null;
        completed: boolean;
        createdAt: Date;
        updatedAt: Date;
        assigneeId: string | null;
        labels: {
            id: string;
            name: string;
            color: string;
            boardId: string;
            createdAt: Date;
        }[];
        assignee: {
            avatarUrl: string | null;
            email: string;
            id: string;
            name: string;
        } | null;
        subtasks: {
            id: string;
            title: string;
            completed: boolean;
            taskId: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
    }[];
}>;
export declare const getTask: (taskId: string, userId: string) => Promise<{
    readonly task?: never;
    readonly error: "Task not found.";
} | {
    readonly task?: never;
    readonly error: "You do not have access to this task.";
} | {
    readonly error?: never;
    readonly task: {
        readonly id: string;
        readonly title: string;
        readonly description: string | null;
        readonly position: number;
        readonly listId: string;
        readonly priority: import("../../generated/prisma/enums.js").TaskPriority;
        readonly dueDate: Date | null;
        readonly completed: boolean;
        readonly createdAt: Date;
        readonly updatedAt: Date;
        readonly assigneeId: string | null;
        readonly labels: {
            id: string;
            name: string;
            color: string;
            boardId: string;
            createdAt: Date;
        }[];
        readonly assignee: {
            avatarUrl: string | null;
            email: string;
            id: string;
            name: string;
        } | null;
        readonly list: {
            board: {
                id: string;
                name: string;
                description: string | null;
                workspaceId: string;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            name: string;
            position: number;
            boardId: string;
            createdAt: Date;
            updatedAt: Date;
        };
        readonly subtasks: {
            id: string;
            title: string;
            completed: boolean;
            taskId: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
    };
}>;
export declare const updateTask: (taskId: string, userId: string, data: {
    title?: string | undefined;
    description?: string | null | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    dueDate?: string | null | undefined;
    completed?: boolean | undefined;
    assigneeId?: string | null | undefined;
}) => Promise<{
    readonly task?: never;
    readonly error: "Task not found.";
} | {
    readonly task?: never;
    readonly error: "You do not have permission to update this task.";
} | {
    readonly error?: never;
    readonly task: {
        readonly id: string;
        readonly title: string;
        readonly description: string | null;
        readonly position: number;
        readonly listId: string;
        readonly priority: import("../../generated/prisma/enums.js").TaskPriority;
        readonly dueDate: Date | null;
        readonly completed: boolean;
        readonly createdAt: Date;
        readonly updatedAt: Date;
        readonly assigneeId: string | null;
        readonly labels: {
            id: string;
            name: string;
            color: string;
            boardId: string;
            createdAt: Date;
        }[];
        readonly assignee: {
            avatarUrl: string | null;
            email: string;
            id: string;
            name: string;
        } | null;
        readonly subtasks: {
            id: string;
            title: string;
            completed: boolean;
            taskId: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
    };
}>;
export declare const deleteTask: (taskId: string, userId: string) => Promise<{
    readonly success?: never;
    readonly error: "Task not found.";
} | {
    readonly success?: never;
    readonly error: "You do not have permission to delete this task.";
} | {
    readonly error?: never;
    readonly success: true;
}>;
export declare const moveTask: (taskId: string, userId: string, targetListId: string, targetPosition: number) => Promise<{
    id: string;
    title: string;
    description: string | null;
    position: number;
    listId: string;
    priority: import("../../generated/prisma/enums.js").TaskPriority;
    dueDate: Date | null;
    completed: boolean;
    createdAt: Date;
    updatedAt: Date;
    assigneeId: string | null;
} | null>;
//# sourceMappingURL=task.service.d.ts.map