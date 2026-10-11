import { prisma } from "../../config/prisma.js";
import { getWorkspaceMembership } from "../workspace/workspace.authorization.js";
import { knowledgeRagService } from "../knowledge/knowledge-rag.service.js";
import type {
    CreatePageInput,
    UpdatePageInput,
    CreateBlockInput,
    UpdateBlockInput,
    BatchSaveBlocksInput,
} from "./page.validation.js";

// ==========================================
// Pages Service
// ==========================================

export const createPage = async (
    workspaceId: string,
    userId: string,
    data: CreatePageInput
) => {
    const membership = await getWorkspaceMembership(workspaceId, userId);
    if (!membership) {
        return { error: "You are not a member of this workspace." } as const;
    }

    if (data.parentId) {
        const parent = await prisma.page.findUnique({
            where: { id: data.parentId },
        });
        if (!parent || parent.workspaceId !== workspaceId) {
            return { error: "Parent page not found in this workspace." } as const;
        }
    }

    // Determine position
    let position = data.position;
    if (position === undefined) {
        const lastPage = await prisma.page.findFirst({
            where: { workspaceId, parentId: data.parentId ?? null },
            orderBy: { position: "desc" },
        });
        position = lastPage ? lastPage.position + 1 : 0;
    }

    const page = await prisma.page.create({
        data: {
            title: data.title || "Untitled",
            icon: data.icon ?? null,
            workspaceId,
            parentId: data.parentId ?? null,
            position,
            blocks: {
                create: {
                    type: "PARAGRAPH",
                    position: 0,
                    content: { text: "" },
                },
            },
        },
        include: {
            blocks: {
                orderBy: { position: "asc" },
            },
            _count: {
                select: { children: true },
            },
        },
    });

    return { page } as const;
};

export const getWorkspacePagesTree = async (
    workspaceId: string,
    userId: string
) => {
    const membership = await getWorkspaceMembership(workspaceId, userId);
    if (!membership) {
        return { error: "You are not a member of this workspace." } as const;
    }

    const pages = await prisma.page.findMany({
        where: { workspaceId },
        orderBy: [{ parentId: "asc" }, { position: "asc" }, { createdAt: "asc" }],
        include: {
            _count: {
                select: { children: true, blocks: true },
            },
        },
    });

    return { pages } as const;
};

export const getPage = async (pageId: string, userId: string) => {
    const page = await prisma.page.findUnique({
        where: { id: pageId },
        include: {
            parent: {
                select: { id: true, title: true, icon: true },
            },
            children: {
                orderBy: { position: "asc" },
                select: { id: true, title: true, icon: true, position: true },
            },
            blocks: {
                orderBy: { position: "asc" },
            },
            workspace: {
                select: { id: true, name: true },
            },
        },
    });

    if (!page) {
        return { error: "Page not found." } as const;
    }

    const membership = await getWorkspaceMembership(page.workspaceId, userId);
    if (!membership) {
        return { error: "You do not have access to this page." } as const;
    }

    return { page } as const;
};

export const updatePage = async (
    pageId: string,
    userId: string,
    data: UpdatePageInput
) => {
    const page = await prisma.page.findUnique({
        where: { id: pageId },
    });

    if (!page) {
        return { error: "Page not found." } as const;
    }

    const membership = await getWorkspaceMembership(page.workspaceId, userId);
    if (!membership) {
        return { error: "You do not have permission to update this page." } as const;
    }

    // Avoid self-parenting
    if (data.parentId && data.parentId === pageId) {
        return { error: "A page cannot be its own parent." } as const;
    }

    const updated = await prisma.page.update({
        where: { id: pageId },
        data: {
            ...(data.title !== undefined ? { title: data.title } : {}),
            ...(data.icon !== undefined ? { icon: data.icon } : {}),
            ...(data.parentId !== undefined ? { parentId: data.parentId } : {}),
            ...(data.position !== undefined ? { position: data.position } : {}),
        },
    });

    return { page: updated } as const;
};

export const deletePage = async (pageId: string, userId: string) => {
    const page = await prisma.page.findUnique({
        where: { id: pageId },
    });

    if (!page) {
        return { error: "Page not found." } as const;
    }

    const membership = await getWorkspaceMembership(page.workspaceId, userId);
    if (!membership) {
        return { error: "You do not have permission to delete this page." } as const;
    }

    await prisma.page.delete({
        where: { id: pageId },
    });

    return { success: true } as const;
};

// ==========================================
// Blocks Service
// ==========================================

export const createBlock = async (
    pageId: string,
    userId: string,
    data: CreateBlockInput
) => {
    const page = await prisma.page.findUnique({
        where: { id: pageId },
    });

    if (!page) {
        return { error: "Page not found." } as const;
    }

    const membership = await getWorkspaceMembership(page.workspaceId, userId);
    if (!membership) {
        return { error: "You do not have permission to edit this page." } as const;
    }

    let position = data.position;
    if (position === undefined) {
        const lastBlock = await prisma.block.findFirst({
            where: { pageId, parentId: data.parentId ?? null },
            orderBy: { position: "desc" },
        });
        position = lastBlock ? lastBlock.position + 1 : 0;
    }

    const block = await prisma.block.create({
        data: {
            pageId,
            type: data.type ?? "PARAGRAPH",
            parentId: data.parentId ?? null,
            position,
            content: data.content ?? { text: "" },
        },
    });

    return { block } as const;
};

export const updateBlock = async (
    blockId: string,
    userId: string,
    data: UpdateBlockInput
) => {
    const block = await prisma.block.findUnique({
        where: { id: blockId },
        include: { page: true },
    });

    if (!block) {
        return { error: "Block not found." } as const;
    }

    const membership = await getWorkspaceMembership(block.page.workspaceId, userId);
    if (!membership) {
        return { error: "You do not have permission to edit this block." } as const;
    }

    const updated = await prisma.block.update({
        where: { id: blockId },
        data: {
            ...(data.type !== undefined ? { type: data.type } : {}),
            ...(data.parentId !== undefined ? { parentId: data.parentId } : {}),
            ...(data.position !== undefined ? { position: data.position } : {}),
            ...(data.content !== undefined ? { content: data.content } : {}),
        },
    });

    return { block: updated } as const;
};

export const deleteBlock = async (blockId: string, userId: string) => {
    const block = await prisma.block.findUnique({
        where: { id: blockId },
        include: { page: true },
    });

    if (!block) {
        return { error: "Block not found." } as const;
    }

    const membership = await getWorkspaceMembership(block.page.workspaceId, userId);
    if (!membership) {
        return { error: "You do not have permission to delete this block." } as const;
    }

    await prisma.block.delete({
        where: { id: blockId },
    });

    return { success: true } as const;
};

export const batchSaveBlocks = async (
    pageId: string,
    userId: string,
    data: BatchSaveBlocksInput
) => {
    const page = await prisma.page.findUnique({
        where: { id: pageId },
    });

    if (!page) {
        return { error: "Page not found." } as const;
    }

    const membership = await getWorkspaceMembership(page.workspaceId, userId);
    if (!membership) {
        return { error: "You do not have permission to edit this page." } as const;
    }

    const blocks = await prisma.$transaction(async (tx) => {
        // Delete existing blocks and recreate in ordered transaction
        await tx.block.deleteMany({
            where: { pageId },
        });

        const createdBlocks = [];
        for (let i = 0; i < data.blocks.length; i++) {
            const b = data.blocks[i]!;
            const created = await tx.block.create({
                data: {
                    pageId,
                    type: b.type,
                    position: b.position !== undefined ? b.position : i,
                    content: b.content ?? { text: "" },
                    parentId: b.parentId ?? null,
                },
            });
            createdBlocks.push(created);
        }
        return createdBlocks;
    });

    // Auto-index page chunks into knowledge RAG in the background
    knowledgeRagService.indexPage(pageId).catch((err) => {
        console.warn(`Failed to auto-index page ${pageId}:`, err);
    });

    return { blocks } as const;
};
