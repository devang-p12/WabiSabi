import { z } from "zod";
export declare const createLabelSchema: z.ZodObject<{
    name: z.ZodString;
    color: z.ZodString;
}, z.core.$strip>;
export declare const updateLabelSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    color: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreateLabelInput = z.infer<typeof createLabelSchema>;
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>;
//# sourceMappingURL=label.validation.d.ts.map