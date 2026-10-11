import { z } from "zod";

export const blockTypeEnum = z.enum([
    "PARAGRAPH",
    "HEADING_1",
    "HEADING_2",
    "HEADING_3",
    "BULLETED_LIST",
    "NUMBERED_LIST",
    "TODO",
    "QUOTE",
    "CODE",
    "DIVIDER",
    "IMAGE",
    "LINK",
    "CALLOUT",
]);
export type BlockType = z.infer<typeof blockTypeEnum>;

// Page Schemas
export const createPageSchema = z.object({
    title: z.string().trim().min(1, "Page title cannot be empty").max(200).optional().default("Untitled"),
    icon: z.string().trim().max(50).nullable().optional(),
    parentId: z.string().uuid("Invalid parent page ID").nullable().optional(),
    position: z.number().int().min(0).optional(),
});

export const updatePageSchema = z.object({
    title: z.string().trim().min(1, "Page title cannot be empty").max(200).optional(),
    icon: z.string().trim().max(50).nullable().optional(),
    parentId: z.string().uuid("Invalid parent page ID").nullable().optional(),
    position: z.number().int().min(0).optional(),
});

// Block Schemas
export const createBlockSchema = z.object({
    type: blockTypeEnum.default("PARAGRAPH"),
    parentId: z.string().uuid("Invalid parent block ID").nullable().optional(),
    position: z.number().int().min(0).optional(),
    content: z.record(z.string(), z.any()).optional().default({ text: "" }),
});

export const updateBlockSchema = z.object({
    type: blockTypeEnum.optional(),
    parentId: z.string().uuid("Invalid parent block ID").nullable().optional(),
    position: z.number().int().min(0).optional(),
    content: z.record(z.string(), z.any()).optional(),
});

export const batchSaveBlocksSchema = z.object({
    blocks: z.array(
        z.object({
            id: z.string().optional(),
            type: blockTypeEnum,
            parentId: z.string().nullable().optional(),
            position: z.number().int().min(0),
            content: z.record(z.string(), z.any()).optional().default({ text: "" }),
        })
    ),
});

export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
export type CreateBlockInput = z.infer<typeof createBlockSchema>;
export type UpdateBlockInput = z.infer<typeof updateBlockSchema>;
export type BatchSaveBlocksInput = z.infer<typeof batchSaveBlocksSchema>;
