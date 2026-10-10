import { z } from "zod";

export const createProjectSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Project name is required")
        .max(100, "Project name cannot exceed 100 characters"),
    description: z
        .string()
        .trim()
        .max(1000, "Description cannot exceed 1000 characters")
        .optional(),
});

export const updateProjectSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Project name is required")
        .max(100, "Project name cannot exceed 100 characters")
        .optional(),
    description: z
        .string()
        .trim()
        .max(1000, "Description cannot exceed 1000 characters")
        .nullable()
        .optional(),
});

export const createMilestoneSchema = z.object({
    title: z
        .string()
        .trim()
        .min(1, "Milestone title is required")
        .max(100, "Milestone title cannot exceed 100 characters"),
    position: z
        .number()
        .int()
        .min(0, "Position cannot be negative")
        .optional(),
});

export const updateMilestoneSchema = z.object({
    title: z
        .string()
        .trim()
        .min(1, "Milestone title is required")
        .max(100, "Milestone title cannot exceed 100 characters")
        .optional(),
    position: z
        .number()
        .int()
        .min(0, "Position cannot be negative")
        .optional(),
});
