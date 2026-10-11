import React, { useRef, useEffect } from "react";
import {
    Heading1,
    Heading2,
    Heading3,
    Pilcrow,
    List,
    ListOrdered,
    CheckSquare,
    Quote,
    Code as CodeIcon,
    Minus,
    Image as ImageIcon,
    Link as LinkIcon,
    AlertCircle,
    GripVertical,
    Plus,
    Trash2,
} from "lucide-react";
import type { Block, BlockType } from "@/api/page.api";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BlockItemProps {
    block: Block;
    index: number;
    onUpdate: (blockId: string, updates: Partial<Block>) => void;
    onDelete: (blockId: string) => void;
    onAddBelow: (afterBlockId: string, type?: BlockType) => void;
    onKeyDownNav?: (e: React.KeyboardEvent, index: number) => void;
}

export const BLOCK_TYPE_CONFIG: Record<
    BlockType,
    { label: string; icon: any; placeholder: string }
> = {
    PARAGRAPH: {
        label: "Text",
        icon: Pilcrow,
        placeholder: "Type '/' for commands or start writing...",
    },
    HEADING_1: {
        label: "Heading 1",
        icon: Heading1,
        placeholder: "Heading 1",
    },
    HEADING_2: {
        label: "Heading 2",
        icon: Heading2,
        placeholder: "Heading 2",
    },
    HEADING_3: {
        label: "Heading 3",
        icon: Heading3,
        placeholder: "Heading 3",
    },
    BULLETED_LIST: {
        label: "Bulleted list",
        icon: List,
        placeholder: "List item",
    },
    NUMBERED_LIST: {
        label: "Numbered list",
        icon: ListOrdered,
        placeholder: "Numbered item",
    },
    TODO: {
        label: "To-do",
        icon: CheckSquare,
        placeholder: "To-do item",
    },
    QUOTE: {
        label: "Quote",
        icon: Quote,
        placeholder: "Empty quote",
    },
    CODE: {
        label: "Code",
        icon: CodeIcon,
        placeholder: "// write code here...",
    },
    DIVIDER: {
        label: "Divider",
        icon: Minus,
        placeholder: "",
    },
    IMAGE: {
        label: "Image",
        icon: ImageIcon,
        placeholder: "Paste image URL...",
    },
    LINK: {
        label: "Link bookmark",
        icon: LinkIcon,
        placeholder: "https://example.com",
    },
    CALLOUT: {
        label: "Callout",
        icon: AlertCircle,
        placeholder: "Callout message...",
    },
};

export default function BlockItem({
    block,
    index,
    onUpdate,
    onDelete,
    onAddBelow,
    onKeyDownNav,
}: BlockItemProps) {
    const textRef = useRef<HTMLTextAreaElement>(null);
    const content = block.content || {};
    const text = content.text || "";

    // Auto-resize textarea height
    useEffect(() => {
        if (textRef.current) {
            textRef.current.style.height = "auto";
            textRef.current.style.height = `${textRef.current.scrollHeight}px`;
        }
    }, [text, block.type]);

    const handleTextChange = (newText: string) => {
        onUpdate(block.id, {
            content: {
                ...content,
                text: newText,
            },
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            // In code blocks, Enter creates a new line
            if (block.type === "CODE") return;

            e.preventDefault();
            // Enter in bullet/numbered/todo continues list
            const nextType: BlockType =
                block.type === "BULLETED_LIST" ||
                block.type === "NUMBERED_LIST" ||
                block.type === "TODO"
                    ? block.type
                    : "PARAGRAPH";
            onAddBelow(block.id, nextType);
        } else if (e.key === "Backspace" && text === "") {
            e.preventDefault();
            onDelete(block.id);
        } else if (onKeyDownNav) {
            onKeyDownNav(e, index);
        }
    };

    const handleTypeChange = (newType: BlockType) => {
        onUpdate(block.id, { type: newType });
    };

    const config = BLOCK_TYPE_CONFIG[block.type] || BLOCK_TYPE_CONFIG.PARAGRAPH;

    return (
        <div className="group relative flex items-start gap-1.5 py-1 px-1 -mx-1 rounded-md hover:bg-muted/40 transition-colors">
            {/* Left Action Handle */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity pt-1 select-none">
                <button
                    type="button"
                    onClick={() => onAddBelow(block.id, "PARAGRAPH")}
                    className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
                    title="Add block below"
                >
                    <Plus className="h-3.5 w-3.5" />
                </button>

                <DropdownMenu>
                    <DropdownMenuTrigger className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted">
                        <GripVertical className="h-3.5 w-3.5 cursor-grab" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48 text-xs">
                        <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                            Turn into
                        </div>
                        {(Object.keys(BLOCK_TYPE_CONFIG) as BlockType[]).map((type) => {
                            const itemConfig = BLOCK_TYPE_CONFIG[type];
                            const ItemIcon = itemConfig.icon;
                            return (
                                <DropdownMenuItem
                                    key={type}
                                    onClick={() => handleTypeChange(type)}
                                    className="flex items-center gap-2 cursor-pointer"
                                >
                                    <ItemIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span>{itemConfig.label}</span>
                                </DropdownMenuItem>
                            );
                        })}
                        <div className="h-px bg-border my-1" />
                        <DropdownMenuItem
                            onClick={() => onDelete(block.id)}
                            className="text-destructive focus:text-destructive flex items-center gap-2 cursor-pointer"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete block</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Block Content by Type */}
            <div className="flex-1 min-w-0">
                {/* 1. Headings */}
                {block.type === "HEADING_1" && (
                    <textarea
                        ref={textRef}
                        rows={1}
                        value={text}
                        onChange={(e) => handleTextChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={config.placeholder}
                        className="w-full bg-transparent font-bold text-2xl text-foreground placeholder:text-muted-foreground/50 resize-none outline-none leading-tight border-none p-0"
                    />
                )}

                {block.type === "HEADING_2" && (
                    <textarea
                        ref={textRef}
                        rows={1}
                        value={text}
                        onChange={(e) => handleTextChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={config.placeholder}
                        className="w-full bg-transparent font-semibold text-xl text-foreground placeholder:text-muted-foreground/50 resize-none outline-none leading-tight border-none p-0"
                    />
                )}

                {block.type === "HEADING_3" && (
                    <textarea
                        ref={textRef}
                        rows={1}
                        value={text}
                        onChange={(e) => handleTextChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={config.placeholder}
                        className="w-full bg-transparent font-medium text-lg text-foreground placeholder:text-muted-foreground/50 resize-none outline-none leading-tight border-none p-0"
                    />
                )}

                {/* 2. Paragraph */}
                {block.type === "PARAGRAPH" && (
                    <textarea
                        ref={textRef}
                        rows={1}
                        value={text}
                        onChange={(e) => handleTextChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={config.placeholder}
                        className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 resize-none outline-none leading-relaxed border-none p-0"
                    />
                )}

                {/* 3. Bullet List */}
                {block.type === "BULLETED_LIST" && (
                    <div className="flex items-start gap-2">
                        <span className="text-muted-foreground select-none pt-0.5">•</span>
                        <textarea
                            ref={textRef}
                            rows={1}
                            value={text}
                            onChange={(e) => handleTextChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={config.placeholder}
                            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 resize-none outline-none leading-relaxed border-none p-0"
                        />
                    </div>
                )}

                {/* 4. Numbered List */}
                {block.type === "NUMBERED_LIST" && (
                    <div className="flex items-start gap-2">
                        <span className="text-xs font-semibold text-muted-foreground select-none pt-0.5">
                            {index + 1}.
                        </span>
                        <textarea
                            ref={textRef}
                            rows={1}
                            value={text}
                            onChange={(e) => handleTextChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={config.placeholder}
                            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 resize-none outline-none leading-relaxed border-none p-0"
                        />
                    </div>
                )}

                {/* 5. To-Do */}
                {block.type === "TODO" && (
                    <div className="flex items-start gap-2">
                        <input
                            type="checkbox"
                            checked={!!content.checked}
                            onChange={(e) =>
                                onUpdate(block.id, {
                                    content: { ...content, checked: e.target.checked },
                                })
                            }
                            className="h-4 w-4 mt-0.5 rounded border-muted-foreground/40 text-primary focus:ring-primary/20 cursor-pointer"
                        />
                        <textarea
                            ref={textRef}
                            rows={1}
                            value={text}
                            onChange={(e) => handleTextChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={config.placeholder}
                            className={`w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 resize-none outline-none leading-relaxed border-none p-0 ${
                                content.checked ? "line-through text-muted-foreground" : ""
                            }`}
                        />
                    </div>
                )}

                {/* 6. Quote */}
                {block.type === "QUOTE" && (
                    <div className="border-l-3 border-primary/50 pl-3 italic text-foreground">
                        <textarea
                            ref={textRef}
                            rows={1}
                            value={text}
                            onChange={(e) => handleTextChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={config.placeholder}
                            className="w-full bg-transparent text-sm placeholder:text-muted-foreground/50 resize-none outline-none leading-relaxed border-none p-0"
                        />
                    </div>
                )}

                {/* 7. Code */}
                {block.type === "CODE" && (
                    <div className="rounded-lg border bg-muted/60 p-3 font-mono text-xs">
                        <textarea
                            ref={textRef}
                            rows={2}
                            value={text}
                            onChange={(e) => handleTextChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={config.placeholder}
                            className="w-full bg-transparent font-mono text-xs text-foreground placeholder:text-muted-foreground/50 resize-none outline-none leading-relaxed border-none p-0"
                        />
                    </div>
                )}

                {/* 8. Divider */}
                {block.type === "DIVIDER" && (
                    <div className="py-2">
                        <hr className="border-t border-border" />
                    </div>
                )}

                {/* 9. Image */}
                {block.type === "IMAGE" && (
                    <div className="space-y-2 py-1">
                        {content.url ? (
                            <div className="relative group/img rounded-lg overflow-hidden border bg-muted/20">
                                <img
                                    src={content.url}
                                    alt={content.caption || "Page attachment"}
                                    className="max-h-96 w-auto object-contain mx-auto"
                                />
                                <div className="p-1 text-center text-xs text-muted-foreground">
                                    <input
                                        type="text"
                                        value={content.caption || ""}
                                        onChange={(e) =>
                                            onUpdate(block.id, {
                                                content: { ...content, caption: e.target.value },
                                            })
                                        }
                                        placeholder="Add a caption..."
                                        className="w-full text-center bg-transparent border-none text-xs outline-none"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/20 text-xs">
                                <ImageIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                                <input
                                    type="text"
                                    value={content.url || ""}
                                    onChange={(e) =>
                                        onUpdate(block.id, {
                                            content: { ...content, url: e.target.value },
                                        })
                                    }
                                    placeholder="Enter image URL..."
                                    className="flex-1 bg-transparent border-none text-xs outline-none"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* 10. Link */}
                {block.type === "LINK" && (
                    <div className="flex items-center gap-2 p-2 rounded-lg border bg-muted/20 text-xs">
                        <LinkIcon className="h-4 w-4 text-primary shrink-0" />
                        <input
                            type="text"
                            value={content.url || ""}
                            onChange={(e) =>
                                onUpdate(block.id, {
                                    content: { ...content, url: e.target.value },
                                })
                            }
                            placeholder="Enter link URL (e.g. https://github.com)..."
                            className="flex-1 bg-transparent border-none text-xs outline-none"
                        />
                        {content.url && (
                            <a
                                href={content.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary hover:underline font-medium text-[11px]"
                            >
                                Open ↗
                            </a>
                        )}
                    </div>
                )}

                {/* 11. Callout */}
                {block.type === "CALLOUT" && (
                    <div className="flex items-start gap-2.5 p-3 rounded-lg border bg-primary/5 border-primary/20 text-xs">
                        <span className="text-base select-none leading-none pt-0.5">💡</span>
                        <textarea
                            ref={textRef}
                            rows={1}
                            value={text}
                            onChange={(e) => handleTextChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={config.placeholder}
                            className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 resize-none outline-none leading-relaxed border-none p-0"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
