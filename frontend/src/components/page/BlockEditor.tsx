import { useState, useEffect, useRef, useCallback } from "react";
import {
    Check,
    Loader2,
    FileText,
} from "lucide-react";
import type { Page, Block, BlockType } from "@/api/page.api";
import {
    updatePage,
    batchSaveBlocks,
} from "@/api/page.api";
import BlockItem, { BLOCK_TYPE_CONFIG } from "./BlockItem";

interface BlockEditorProps {
    page: Page;
    onPageUpdated?: (page: Page) => void;
}

export default function BlockEditor({ page, onPageUpdated }: BlockEditorProps) {
    const [title, setTitle] = useState(page.title);
    const [icon, setIcon] = useState(page.icon || "");
    const [blocks, setBlocks] = useState<Block[]>(
        page.blocks && page.blocks.length > 0
            ? page.blocks
            : [
                  {
                      id: "init-1",
                      pageId: page.id,
                      type: "PARAGRAPH",
                      position: 0,
                      content: { text: "" },
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                  },
              ]
    );

    const [isSaving, setIsSaving] = useState(false);
    const [savedStatus, setSavedStatus] = useState<"saved" | "unsaved">("saved");
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Sync when page changes
    useEffect(() => {
        setTitle(page.title);
        setIcon(page.icon || "");
        if (page.blocks && page.blocks.length > 0) {
            setBlocks(page.blocks);
        }
        setSavedStatus("saved");
    }, [page.id]);

    // Autosave debouncer
    const triggerAutoSave = useCallback(
        (newTitle: string, newIcon: string, newBlocks: Block[]) => {
            setSavedStatus("unsaved");
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }

            saveTimeoutRef.current = setTimeout(async () => {
                try {
                    setIsSaving(true);
                    // 1. Update Page Title/Icon
                    const updatedPage = await updatePage(page.id, {
                        title: newTitle.trim() || "Untitled",
                        icon: newIcon.trim() || null,
                    });

                    // 2. Batch save blocks
                    const savedBlocks = await batchSaveBlocks(
                        page.id,
                        newBlocks.map((b, idx) => ({
                            id: b.id.startsWith("new-") || b.id.startsWith("init-") ? undefined : b.id,
                            type: b.type,
                            position: idx,
                            parentId: b.parentId,
                            content: b.content || { text: "" },
                        }))
                    );

                    setBlocks(savedBlocks);
                    setSavedStatus("saved");
                    if (onPageUpdated) {
                        onPageUpdated({ ...updatedPage, blocks: savedBlocks });
                    }
                } catch (err) {
                    console.error("Autosave page failed:", err);
                } finally {
                    setIsSaving(false);
                }
            }, 1200);
        },
        [page.id, onPageUpdated]
    );

    const handleTitleChange = (newTitle: string) => {
        setTitle(newTitle);
        triggerAutoSave(newTitle, icon, blocks);
    };

    const handleIconChange = (newIcon: string) => {
        setIcon(newIcon);
        triggerAutoSave(title, newIcon, blocks);
    };

    const handleUpdateBlock = (blockId: string, updates: Partial<Block>) => {
        const nextBlocks = blocks.map((b) =>
            b.id === blockId ? { ...b, ...updates } : b
        );
        setBlocks(nextBlocks);
        triggerAutoSave(title, icon, nextBlocks);
    };

    const handleDeleteBlock = (blockId: string) => {
        // Keep at least one block
        if (blocks.length <= 1) {
            const nextBlocks: Block[] = [
                {
                    id: `new-${Date.now()}`,
                    pageId: page.id,
                    type: "PARAGRAPH",
                    position: 0,
                    content: { text: "" },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
            ];
            setBlocks(nextBlocks);
            triggerAutoSave(title, icon, nextBlocks);
            return;
        }

        const nextBlocks = blocks.filter((b) => b.id !== blockId);
        setBlocks(nextBlocks);
        triggerAutoSave(title, icon, nextBlocks);
    };

    const handleAddBlockBelow = (afterBlockId: string, type: BlockType = "PARAGRAPH") => {
        const targetIndex = blocks.findIndex((b) => b.id === afterBlockId);
        const newBlock: Block = {
            id: `new-${Date.now()}-${Math.random()}`,
            pageId: page.id,
            type,
            position: targetIndex + 1,
            content: { text: "" },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const nextBlocks = [...blocks];
        nextBlocks.splice(targetIndex + 1, 0, newBlock);
        setBlocks(nextBlocks);
        triggerAutoSave(title, icon, nextBlocks);
    };

    const handleQuickAddBlock = (type: BlockType) => {
        const newBlock: Block = {
            id: `new-${Date.now()}-${Math.random()}`,
            pageId: page.id,
            type,
            position: blocks.length,
            content: { text: "" },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        const nextBlocks = [...blocks, newBlock];
        setBlocks(nextBlocks);
        triggerAutoSave(title, icon, nextBlocks);
    };

    return (
        <div className="max-w-3xl mx-auto px-6 py-8 min-h-[500px] flex flex-col space-y-6">
            {/* Top Toolbar / Save Status */}
            <div className="flex items-center justify-between text-xs text-muted-foreground border-b pb-3">
                <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span>Wabi Page Editor</span>
                </div>

                <div className="flex items-center gap-2">
                    {isSaving ? (
                        <div className="flex items-center gap-1.5 text-muted-foreground animate-pulse">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Saving...</span>
                        </div>
                    ) : savedStatus === "saved" ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                            <Check className="h-3.5 w-3.5" />
                            <span>Saved</span>
                        </div>
                    ) : (
                        <span className="text-amber-600 dark:text-amber-400">Unsaved changes...</span>
                    )}
                </div>
            </div>

            {/* Page Header (Icon & Title) */}
            <div className="space-y-3 pt-2">
                {/* Icon input */}
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={icon}
                        onChange={(e) => handleIconChange(e.target.value)}
                        placeholder="📝"
                        className="w-10 h-10 text-xl text-center bg-muted/40 rounded-xl border hover:border-primary/40 focus:border-primary outline-none transition-all cursor-pointer"
                        title="Click to set page emoji icon"
                    />
                </div>

                {/* Title */}
                <input
                    type="text"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Untitled"
                    className="w-full bg-transparent text-3xl sm:text-4xl font-extrabold text-foreground placeholder:text-muted-foreground/40 outline-none border-none p-0 tracking-tight"
                />
            </div>

            {/* Blocks List */}
            <div className="space-y-1 flex-1 pt-2">
                {blocks.map((block, index) => (
                    <BlockItem
                        key={block.id}
                        block={block}
                        index={index}
                        onUpdate={handleUpdateBlock}
                        onDelete={handleDeleteBlock}
                        onAddBelow={handleAddBlockBelow}
                    />
                ))}
            </div>

            {/* Bottom Quick-Add Toolbar */}
            <div className="pt-6 border-t">
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                    <span className="text-[11px] font-semibold text-muted-foreground mr-1">
                        Insert:
                    </span>
                    {(
                        [
                            "PARAGRAPH",
                            "HEADING_2",
                            "BULLETED_LIST",
                            "TODO",
                            "CODE",
                            "QUOTE",
                            "CALLOUT",
                            "DIVIDER",
                        ] as BlockType[]
                    ).map((type) => {
                        const cfg = BLOCK_TYPE_CONFIG[type];
                        const ItemIcon = cfg.icon;
                        return (
                            <button
                                key={type}
                                type="button"
                                onClick={() => handleQuickAddBlock(type)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground text-[11px] font-medium transition-colors border"
                            >
                                <ItemIcon className="h-3 w-3" />
                                <span>{cfg.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
