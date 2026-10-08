import { z } from "zod";
export declare const createListSchema: z.ZodObject<{
    name: z.ZodString;
}, z.core.$strip>;
export declare const updateListSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const reorderListsSchema: z.ZodObject<{
    listIds: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
//# sourceMappingURL=list.validation.d.ts.map