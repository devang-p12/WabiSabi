import { z } from "zod";
export declare const createWorkspaceSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateWorkspaceSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export declare const addWorkspaceMemberSchema: z.ZodObject<{
    email: z.ZodString;
    role: z.ZodDefault<z.ZodEnum<{
        ADMIN: "ADMIN";
        MEMBER: "MEMBER";
    }>>;
}, z.core.$strip>;
export declare const updateWorkspaceMemberSchema: z.ZodObject<{
    role: z.ZodEnum<{
        ADMIN: "ADMIN";
        MEMBER: "MEMBER";
    }>;
}, z.core.$strip>;
//# sourceMappingURL=workspace.validation.d.ts.map