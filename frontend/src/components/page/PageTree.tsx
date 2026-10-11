import { useState } from "react";
import {
    ChevronRight,
    ChevronDown,
    Plus,
    Trash2,
    FolderPlus,
    MoreVertical,
} from "lucide-react";
import type { Page } from "@/api/page.api";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PageTreeProps {
    pages: Page[];
    selectedPageId?: string;
    onSelectPage: (pageId: string) => void;
    onCreatePage: (parentId?: string) => void;
    onDeletePage: (pageId: string) => void;
}

export default function PageTree({
    pages,
    selectedPageId,
    onSelectPage,
    onCreatePage,
    onDeletePage,
}: PageTreeProps) {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const toggleExpand = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpanded((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    // Build hierarchy (root pages vs children)
    const rootPages = pages.filter((p) => !p.parentId);
    const getChildren = (parentId: string) => pages.filter((p) => p.parentId === parentId);

    const renderPageItem = (page: Page, level = 0) => {
        const children = getChildren(page.id);
        const hasChildren = children.length > 0;
        const isExpanded = !!expanded[page.id];
        const isSelected = selectedPageId === page.id;

        return (
            <div key={page.id} className="select-none">
                <div
                    onClick={() => onSelectPage(page.id)}
                    style={{ paddingLeft: `${Math.max(8, level * 14 + 8)}px` }}
                    className={`group flex items-center justify-between pr-2 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        isSelected
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {hasChildren ? (
                            <button
                                type="button"
                                onClick={(e) => toggleExpand(page.id, e)}
                                className="h-4 w-4 shrink-0 rounded flex items-center justify-center hover:bg-muted"
                            >
                                {isExpanded ? (
                                    <ChevronDown className="h-3 w-3" />
                                ) : (
                                    <ChevronRight className="h-3 w-3" />
                                )}
                            </button>
                        ) : (
                            <span className="w-4 shrink-0" />
                        )}

                        <span className="shrink-0 text-sm">{page.icon || "📄"}</span>
                        <span className="truncate">{page.title || "Untitled"}</span>
                    </div>

                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onCreatePage(page.id);
                            }}
                            className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
                            title="Add sub-page"
                        >
                            <Plus className="h-3 w-3" />
                        </button>

                        <DropdownMenu>
                            <DropdownMenuTrigger
                                onClick={(e) => e.stopPropagation()}
                                className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
                            >
                                <MoreVertical className="h-3 w-3" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="text-xs">
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onCreatePage(page.id);
                                    }}
                                    className="cursor-pointer"
                                >
                                    <FolderPlus className="mr-2 h-3.5 w-3.5" />
                                    Add subpage
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeletePage(page.id);
                                    }}
                                    className="text-destructive focus:text-destructive cursor-pointer"
                                >
                                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                                    Delete page
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Sub-pages */}
                {hasChildren && isExpanded && (
                    <div className="space-y-0.5">
                        {children.map((child) => renderPageItem(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <span>Pages</span>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onCreatePage()}
                    className="h-5 w-5 text-muted-foreground hover:text-foreground"
                    title="Create root page"
                >
                    <Plus className="h-3.5 w-3.5" />
                </Button>
            </div>

            {rootPages.length === 0 ? (
                <div className="px-2 py-4 text-center text-xs text-muted-foreground space-y-2">
                    <p>No pages yet.</p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onCreatePage()}
                        className="text-[11px] h-7 w-full shadow-xs"
                    >
                        <Plus className="mr-1 h-3 w-3" />
                        New Page
                    </Button>
                </div>
            ) : (
                <div className="space-y-0.5">
                    {rootPages.map((page) => renderPageItem(page, 0))}
                </div>
            )}
        </div>
    );
}
