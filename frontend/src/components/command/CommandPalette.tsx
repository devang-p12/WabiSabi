import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Search,
    X,
    FolderKanban,
    Columns3,
    CheckCircle2,
    Circle,
    LayoutDashboard,
    Sun,
    Moon,
    Copy,
    Check,
    ArrowRight,
    Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/components/theme-provider";
import {
    searchGlobal,
    type GlobalSearchResult,
} from "@/api/search.api";
import { Badge } from "@/components/ui/badge";
import { cn } from "cn";

export type PaletteItemType = "action" | "task" | "board" | "workspace";

export interface PaletteItem {
    id: string;
    type: PaletteItemType;
    category: string;
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    action: () => void;
    badge?: string;
    badgeColor?: string;
}

export default function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<GlobalSearchResult>({
        workspaces: [],
        boards: [],
        tasks: [],
    });
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [copied, setCopied] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { theme, setTheme } = useTheme();

    // Toggle open state on Cmd+K / Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setOpen((prev) => !prev);
            } else if (e.key === "Escape" && open) {
                e.preventDefault();
                setOpen(false);
            }
        };

        const handleCustomOpen = () => {
            setOpen(true);
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("open-command-palette", handleCustomOpen);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("open-command-palette", handleCustomOpen);
        };
    }, [open]);

    // Focus input on open
    useEffect(() => {
        if (open) {
            setQuery("");
            setSelectedIndex(0);
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        }
    }, [open]);

    // Debounced remote search
    useEffect(() => {
        if (!open || !isAuthenticated) return;

        const trimmed = query.trim();
        if (!trimmed) {
            setSearchResults({ workspaces: [], boards: [], tasks: [] });
            setLoading(false);
            return;
        }

        setLoading(true);
        const timer = setTimeout(async () => {
            try {
                const data = await searchGlobal(trimmed);
                setSearchResults(data);
                setSelectedIndex(0);
            } catch (err) {
                console.error("Failed to perform global search:", err);
            } finally {
                setLoading(false);
            }
        }, 180);

        return () => clearTimeout(timer);
    }, [query, open, isAuthenticated]);

    // Static Quick Actions
    const quickActions: PaletteItem[] = useMemo(() => {
        const actions: PaletteItem[] = [
            {
                id: "action-dashboard",
                type: "action",
                category: "Navigation",
                title: "Go to Dashboard",
                subtitle: "View all workspaces and recent activity",
                icon: <LayoutDashboard className="h-4 w-4 text-blue-500" />,
                action: () => {
                    navigate("/dashboard");
                    setOpen(false);
                },
            },
            {
                id: "action-theme",
                type: "action",
                category: "Preferences",
                title: theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
                subtitle: "Toggle application appearance",
                icon:
                    theme === "dark" ? (
                        <Sun className="h-4 w-4 text-amber-500" />
                    ) : (
                        <Moon className="h-4 w-4 text-indigo-500" />
                    ),
                action: () => {
                    setTheme(theme === "dark" ? "light" : "dark");
                    setOpen(false);
                },
            },
            {
                id: "action-copy-url",
                type: "action",
                category: "Quick Actions",
                title: copied ? "URL Copied to Clipboard!" : "Copy Current URL",
                subtitle: "Share the current workspace or board link",
                icon: copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                    <Copy className="h-4 w-4 text-zinc-500" />
                ),
                action: () => {
                    navigator.clipboard.writeText(window.location.href);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                    setOpen(false);
                },
            },
        ];

        if (!query.trim()) return actions;

        const lower = query.toLowerCase();
        return actions.filter(
            (a) =>
                a.title.toLowerCase().includes(lower) ||
                (a.subtitle && a.subtitle.toLowerCase().includes(lower))
        );
    }, [theme, setTheme, navigate, copied, query]);

    // Build flattened items list for keyboard navigation
    const allItems: PaletteItem[] = useMemo(() => {
        const items: PaletteItem[] = [];

        // 1. Actions
        items.push(...quickActions);

        // 2. Tasks
        for (const task of searchResults.tasks) {
            items.push({
                id: `task-${task.id}`,
                type: "task",
                category: "Tasks",
                title: task.title,
                subtitle: `${task.list.board.name} • ${task.list.name}`,
                badge: task.priority,
                badgeColor:
                    task.priority === "URGENT"
                        ? "text-red-600 bg-red-100 dark:bg-red-950 dark:text-red-300"
                        : task.priority === "HIGH"
                          ? "text-orange-600 bg-orange-100 dark:bg-orange-950 dark:text-orange-300"
                          : task.priority === "MEDIUM"
                            ? "text-blue-600 bg-blue-100 dark:bg-blue-950 dark:text-blue-300"
                            : "text-zinc-600 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300",
                icon: task.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : (
                    <Circle className="h-4 w-4 text-zinc-400 shrink-0" />
                ),
                action: () => {
                    navigate(
                        `/workspaces/${task.list.board.workspaceId}/boards/${task.list.board.id}`
                    );
                    setOpen(false);
                },
            });
        }

        // 3. Boards
        for (const board of searchResults.boards) {
            items.push({
                id: `board-${board.id}`,
                type: "board",
                category: "Boards",
                title: board.name,
                subtitle: board.workspace ? `Workspace: ${board.workspace.name}` : undefined,
                icon: <Columns3 className="h-4 w-4 text-primary shrink-0" />,
                action: () => {
                    navigate(`/workspaces/${board.workspaceId}/boards/${board.id}`);
                    setOpen(false);
                },
            });
        }

        // 4. Workspaces
        for (const ws of searchResults.workspaces) {
            items.push({
                id: `workspace-${ws.id}`,
                type: "workspace",
                category: "Workspaces",
                title: ws.name,
                subtitle: ws.description ?? "Workspace",
                icon: <FolderKanban className="h-4 w-4 text-purple-500 shrink-0" />,
                action: () => {
                    navigate(`/workspaces/${ws.id}`);
                    setOpen(false);
                },
            });
        }

        return items;
    }, [quickActions, searchResults, navigate]);

    // Keyboard navigation within the list
    const handleListKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (allItems.length === 0) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % allItems.length);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + allItems.length) % allItems.length);
            } else if (e.key === "Enter") {
                e.preventDefault();
                const selected = allItems[selectedIndex];
                if (selected) {
                    selected.action();
                }
            }
        },
        [allItems, selectedIndex]
    );

    // Scroll active item into view
    useEffect(() => {
        if (!listRef.current) return;
        const activeElement = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
        if (activeElement) {
            activeElement.scrollIntoView({ block: "nearest" });
        }
    }, [selectedIndex]);

    if (!open) return null;

    // Group items by category for rendering with headers
    const groupedCategories = Array.from(new Set(allItems.map((i) => i.category)));

    let currentIndexCounter = 0;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-150">
            {/* Backdrop click to close */}
            <div className="fixed inset-0 -z-10" onClick={() => setOpen(false)} />

            {/* Modal Dialog */}
            <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card text-card-foreground shadow-2xl ring-1 ring-black/10 dark:ring-white/10 overflow-hidden animate-in zoom-in-95 duration-150">
                {/* Search Bar Input */}
                <div className="relative flex items-center border-b px-4 py-3.5 bg-muted/20">
                    <Search className="h-5 w-5 text-muted-foreground shrink-0 mr-3" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleListKeyDown}
                        placeholder="Search tasks, boards, workspaces, or run commands..."
                        className="w-full bg-transparent text-sm sm:text-base outline-hidden placeholder:text-muted-foreground/70"
                    />

                    {loading && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0 mr-2" />
                    )}

                    {query && (
                        <button
                            onClick={() => setQuery("")}
                            className="p-1 rounded-md text-muted-foreground hover:text-foreground mr-1.5 cursor-pointer"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}

                    <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-muted border border-border rounded-sm">
                        ESC
                    </kbd>
                </div>

                {/* Results List */}
                <div ref={listRef} className="max-h-[380px] sm:max-h-[440px] overflow-y-auto p-2 space-y-4">
                    {allItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                            <Search className="h-8 w-8 stroke-1 text-muted-foreground/60 mb-2" />
                            <p className="text-sm font-medium text-foreground">
                                No results found for &ldquo;{query}&rdquo;
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Try searching with different keywords or check your spelling.
                            </p>
                        </div>
                    ) : (
                        groupedCategories.map((category) => {
                            const categoryItems = allItems.filter((i) => i.category === category);

                            return (
                                <div key={category} className="space-y-1">
                                    <div className="px-3 py-1 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground/80">
                                        {category}
                                    </div>

                                    {categoryItems.map((item) => {
                                        const itemIndex = currentIndexCounter++;
                                        const isSelected = itemIndex === selectedIndex;

                                        return (
                                            <div
                                                key={item.id}
                                                data-index={itemIndex}
                                                onClick={() => item.action()}
                                                onMouseEnter={() => setSelectedIndex(itemIndex)}
                                                className={cn(
                                                    "group flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm cursor-pointer transition-colors",
                                                    isSelected
                                                        ? "bg-primary/10 text-primary font-medium"
                                                        : "text-foreground hover:bg-muted/50"
                                                )}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-background border border-border shadow-2xs shrink-0">
                                                        {item.icon}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p className="truncate text-xs sm:text-sm font-medium">
                                                            {item.title}
                                                        </p>
                                                        {item.subtitle && (
                                                            <p className="truncate text-[11px] text-muted-foreground">
                                                                {item.subtitle}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    {item.badge && (
                                                        <Badge
                                                            variant="secondary"
                                                            className={cn("text-[10px] px-1.5 py-0 h-4 font-semibold", item.badgeColor)}
                                                        >
                                                            {item.badge}
                                                        </Badge>
                                                    )}

                                                    {isSelected && (
                                                        <span className="flex items-center text-[10px] text-primary/80 font-mono">
                                                            ↵ <ArrowRight className="h-2.5 w-2.5 ml-0.5" />
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between border-t px-4 py-2 bg-muted/30 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 rounded-sm bg-muted border border-border font-mono text-[9px]">
                                ↑
                            </kbd>
                            <kbd className="px-1.5 py-0.5 rounded-sm bg-muted border border-border font-mono text-[9px]">
                                ↓
                            </kbd>
                            navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 rounded-sm bg-muted border border-border font-mono text-[9px]">
                                ↵
                            </kbd>
                            select
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 rounded-sm bg-muted border border-border font-mono text-[9px]">
                                ESC
                            </kbd>
                            close
                        </span>
                    </div>

                    <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground">
                        <span>WabiSabi Spotlight</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
