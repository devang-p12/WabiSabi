import { z } from "zod";
export declare const createBoardSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateBoardSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
//# sourceMappingURL=board.validation.d.ts.map