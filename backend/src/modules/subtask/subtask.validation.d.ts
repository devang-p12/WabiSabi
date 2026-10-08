import { z } from "zod";
export declare const createSubtaskSchema: z.ZodObject<{
    title: z.ZodString;
}, z.core.$strip>;
export declare const updateSubtaskSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    completed: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
//# sourceMappingURL=subtask.validation.d.ts.map