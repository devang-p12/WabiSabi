import type { CreateLabelInput, UpdateLabelInput } from "./label.validation.js";
export declare const getBoardLabels: (boardId: string) => Promise<{
    id: string;
    name: string;
    color: string;
    boardId: string;
    createdAt: Date;
}[]>;
export declare const createLabel: (boardId: string, data: CreateLabelInput) => Promise<{
    id: string;
    name: string;
    color: string;
    boardId: string;
    createdAt: Date;
}>;
export declare const updateLabel: (labelId: string, data: UpdateLabelInput) => Promise<{
    id: string;
    name: string;
    color: string;
    boardId: string;
    createdAt: Date;
}>;
export declare const deleteLabel: (labelId: string) => Promise<{
    id: string;
    name: string;
    color: string;
    boardId: string;
    createdAt: Date;
}>;
export declare const addLabelToTask: (taskId: string, labelId: string) => Promise<{
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
}>;
export declare const removeLabelFromTask: (taskId: string, labelId: string) => Promise<{
    taskId: string;
    labelId: string;
}>;
//# sourceMappingURL=label.service.d.ts.map