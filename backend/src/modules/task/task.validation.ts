
import { z } from "zod";

const taskPrioritySchema = z.enum([
    "LOW",
    "MEDIUM",
    "HIGH",
    "URGENT",
]);

const taskDueDateSchema = z
    .string()
    .datetime({
        message: "Invalid due date",
    })
    .nullable()
    .optional();

export const createTaskSchema = z.object({
    title: z
        .string()
        .trim()
        .min(
            1,
            "Task title is required",
        )
        .max(
            200,
            "Task title cannot exceed 200 characters",
        ),

    description: z
        .string()
        .trim()
        .max(
            5000,
            "Description cannot exceed 5000 characters",
        )
        .optional(),

    priority:
        taskPrioritySchema.optional(),

    dueDate:
        taskDueDateSchema,
});

export const updateTaskSchema = z.object({
    title: z
        .string()
        .trim()
        .min(
            1,
            "Task title is required",
        )
        .max(
            200,
            "Task title cannot exceed 200 characters",
        )
        .optional(),

    description: z
        .string()
        .trim()
        .max(
            5000,
            "Description cannot exceed 5000 characters",
        )
        .nullable()
        .optional(),

    priority:
        taskPrioritySchema.optional(),

    dueDate:
        taskDueDateSchema,
});

export const moveTaskSchema = z.object({
    listId: z
        .string()
        .uuid("Invalid list ID"),

    position: z
        .number()
        .int()
        .min(
            0,
            "Position cannot be negative",
        ),
});