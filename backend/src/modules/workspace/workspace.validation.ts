import { z } from "zod";

export const createWorkspaceSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Workspace name must be at least 2 characters")
        .max(100, "Workspace name cannot exceed 100 characters"),

    description: z
        .string()
        .trim()
        .max(500, "Description cannot exceed 500 characters")
        .optional(),
});

export const updateWorkspaceSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2)
        .max(100)
        .optional(),

    description: z
        .string()
        .trim()
        .max(500)
        .nullable()
        .optional(),
});

export const addWorkspaceMemberSchema = z.object({
    email: z
        .string()
        .trim()
        .email("Invalid email address"),

    role: z
        .enum(["ADMIN", "MEMBER"])
        .default("MEMBER"),
});