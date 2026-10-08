export declare const getTaskSubtasks: (taskId: string) => Promise<{
    id: string;
    title: string;
    completed: boolean;
    taskId: string;
    createdAt: Date;
    updatedAt: Date;
}[]>;
export declare const createSubtask: (taskId: string, data: {
    title: string;
}) => Promise<{
    id: string;
    title: string;
    completed: boolean;
    taskId: string;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare const updateSubtask: (subtaskId: string, data: {
    title?: string;
    completed?: boolean;
}) => Promise<{
    id: string;
    title: string;
    completed: boolean;
    taskId: string;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare const deleteSubtask: (subtaskId: string) => Promise<{
    id: string;
    title: string;
    completed: boolean;
    taskId: string;
    createdAt: Date;
    updatedAt: Date;
}>;
//# sourceMappingURL=subtask.service.d.ts.map