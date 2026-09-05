import { z } from "zod";

export const createListSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "List name is required")
        .max(100, "List name cannot exceed 100 characters"),
});

export const updateListSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "List name is required")
        .max(100, "List name cannot exceed 100 characters")
        .optional(),
});

export const reorderListsSchema = z.object({
    listIds: z
        .array(z.string().uuid())
        .min(1, "At least one list is required"),
});