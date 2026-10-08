import { z } from "zod";
export declare const createTaskSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodEnum<{
        HIGH: "HIGH";
        LOW: "LOW";
        MEDIUM: "MEDIUM";
        URGENT: "URGENT";
    }>>;
    dueDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    assigneeId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export declare const updateTaskSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    priority: z.ZodOptional<z.ZodEnum<{
        HIGH: "HIGH";
        LOW: "LOW";
        MEDIUM: "MEDIUM";
        URGENT: "URGENT";
    }>>;
    dueDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    assigneeId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    completed: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const moveTaskSchema: z.ZodObject<{
    listId: z.ZodString;
    position: z.ZodNumber;
}, z.core.$strip>;
//# sourceMappingURL=task.validation.d.ts.map