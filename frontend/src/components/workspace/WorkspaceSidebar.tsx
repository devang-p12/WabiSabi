import {
    ChevronLeft,
    ChevronRight,
    Home,
    LayoutDashboard,
    Plus,
    Settings,
    Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

import type { Workspace } from "@/api/workspace.api";
import type { Board } from "@/api/board.api";

interface WorkspaceSidebarProps {
    workspace: Workspace;
    boards: Board[];
    selectedBoardId: string | null;
    canCreateBoard: boolean;
    collapsed: boolean;
    onSelectHome: () => void;
    onSelectBoard: (board: Board) => void;
    onCreateBoard: () => void;
    onToggleCollapse: () => void;
}

export function WorkspaceSidebar({
    workspace,
    boards,
    selectedBoardId,
    canCreateBoard,
    collapsed,
    onSelectHome,
    onSelectBoard,
    onCreateBoard,
    onToggleCollapse,
}: WorkspaceSidebarProps) {
    const isHome = selectedBoardId === null;

    return (
        <aside
            className={`flex h-[calc(100vh-4rem)] shrink-0 flex-col border-r bg-background transition-all duration-200 ${
                collapsed ? "w-16" : "w-64"
            }`}
        >
            {/* Workspace header */}
            <div
                className={`flex h-16 items-center ${
                    collapsed
                        ? "justify-center"
                        : "gap-3 px-4"
                }`}
            >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <LayoutDashboard className="h-4 w-4" />
                </div>

                {!collapsed && (
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                            {workspace.name}
                        </p>

                        <p className="text-xs text-muted-foreground">
                            Workspace
                        </p>
                    </div>
                )}
            </div>

            <Separator />

            <div className="flex-1 overflow-y-auto p-3">
                {/* Home */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            type="button"
                            onClick={onSelectHome}
                            className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                                isHome
                                    ? "bg-accent font-medium text-accent-foreground"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            } ${
                                collapsed
                                    ? "justify-center"
                                    : ""
                            }`}
                        >
                            <Home className="h-4 w-4 shrink-0" />

                            {!collapsed && (
                                <span>Home</span>
                            )}
                        </button>
                    </TooltipTrigger>

                    {collapsed && (
                        <TooltipContent side="right">
                            Home
                        </TooltipContent>
                    )}
                </Tooltip>

                {/* Boards */}
                <div className="mt-6">
                    {!collapsed ? (
                        <div className="mb-2 flex items-center justify-between px-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Boards
                            </span>

                            {canCreateBoard && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={onCreateBoard}
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>

                                    <TooltipContent>
                                        Create board
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </div>
                    ) : (
                        canCreateBoard && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="mb-2 w-full"
                                        onClick={onCreateBoard}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>

                                <TooltipContent side="right">
                                    Create board
                                </TooltipContent>
                            </Tooltip>
                        )
                    )}

                    <div className="space-y-1">
                        {boards.length === 0 ? (
                            !collapsed && (
                                <p className="px-3 py-2 text-xs text-muted-foreground">
                                    No boards yet
                                </p>
                            )
                        ) : (
                            boards.map((board) => {
                                const isActive =
                                    selectedBoardId === board.id;

                                return (
                                    <Tooltip key={board.id}>
                                        <TooltipTrigger asChild>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    onSelectBoard(board)
                                                }
                                                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                                                    isActive
                                                        ? "bg-accent font-medium text-accent-foreground"
                                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                                } ${
                                                    collapsed
                                                        ? "justify-center"
                                                        : ""
                                                }`}
                                            >
                                                <div className="h-2 w-2 shrink-0 rounded-sm bg-primary/70" />

                                                {!collapsed && (
                                                    <span className="truncate">
                                                        {board.name}
                                                    </span>
                                                )}
                                            </button>
                                        </TooltipTrigger>

                                        {collapsed && (
                                            <TooltipContent side="right">
                                                {board.name}
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Workspace navigation */}
                {!collapsed && (
                    <div className="mt-6">
                        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Workspace
                        </p>

                        <button
                            type="button"
                            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                            <Users className="h-4 w-4" />
                            Members
                        </button>

                        <button
                            type="button"
                            className="mt-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                            <Settings className="h-4 w-4" />
                            Settings
                        </button>
                    </div>
                )}
            </div>

            {/* Collapse button */}
            <div className="border-t p-3">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`w-full ${
                                collapsed
                                    ? "justify-center"
                                    : "justify-start"
                            }`}
                            onClick={onToggleCollapse}
                        >
                            {collapsed ? (
                                <ChevronRight className="h-4 w-4" />
                            ) : (
                                <ChevronLeft className="h-4 w-4" />
                            )}

                            {!collapsed && (
                                <span className="ml-2">
                                    Collapse
                                </span>
                            )}
                        </Button>
                    </TooltipTrigger>

                    {collapsed && (
                        <TooltipContent side="right">
                            Expand sidebar
                        </TooltipContent>
                    )}
                </Tooltip>
            </div>
        </aside>
    );
}