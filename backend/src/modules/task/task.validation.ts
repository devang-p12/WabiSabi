
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

    assigneeId: z
        .string()
        .uuid("Invalid assignee ID")
        .nullable()
        .optional(),

    coverUrl: z
        .string()
        .nullable()
        .optional(),

    projectId: z
        .string()
        .uuid("Invalid project ID")
        .nullable()
        .optional(),

    milestoneId: z
        .string()
        .uuid("Invalid milestone ID")
        .nullable()
        .optional(),

    estimatedMinutes: z
        .number()
        .int()
        .min(0, "Estimated minutes cannot be negative")
        .nullable()
        .optional(),

    actualMinutes: z
        .number()
        .int()
        .min(0, "Actual minutes cannot be negative")
        .nullable()
        .optional(),

    startedAt: z
        .string()
        .datetime({ message: "Invalid startedAt datetime" })
        .nullable()
        .optional(),

    completedAt: z
        .string()
        .datetime({ message: "Invalid completedAt datetime" })
        .nullable()
        .optional(),
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

    assigneeId: z
        .string()
        .uuid("Invalid assignee ID")
        .nullable()
        .optional(),

    coverUrl: z
        .string()
        .nullable()
        .optional(),

    completed:
        z.boolean().optional(),

    projectId: z
        .string()
        .uuid("Invalid project ID")
        .nullable()
        .optional(),

    milestoneId: z
        .string()
        .uuid("Invalid milestone ID")
        .nullable()
        .optional(),

    estimatedMinutes: z
        .number()
        .int()
        .min(0, "Estimated minutes cannot be negative")
        .nullable()
        .optional(),

    actualMinutes: z
        .number()
        .int()
        .min(0, "Actual minutes cannot be negative")
        .nullable()
        .optional(),

    startedAt: z
        .string()
        .datetime({ message: "Invalid startedAt datetime" })
        .nullable()
        .optional(),

    completedAt: z
        .string()
        .datetime({ message: "Invalid completedAt datetime" })
        .nullable()
        .optional(),
});

export const createTaskDependencySchema = z.object({
    dependsOnId: z
        .string()
        .uuid("Invalid dependsOn task ID"),
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