import {
    CalendarDays,
    Columns3,
    Filter,
    Search,
    SlidersHorizontal,
    Table2,
    User,
    X,
} from "lucide-react";
import { cn } from "cn";
import type { WorkspaceMember } from "@/api/workspace.api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LabelManager from "./LabelManager";

export type BoardViewMode = "board" | "table" | "calendar";

export type SortOption =
    | "position"
    | "title"
    | "created"
    | "dueDateAsc"
    | "dueDateDesc";

export type PriorityFilter = "ALL" | "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type StatusFilter =
    | "ALL"
    | "ACTIVE"
    | "COMPLETED";

export type DueDateFilter =
    | "ALL"
    | "OVERDUE"
    | "TODAY"
    | "THIS_WEEK"
    | "NO_DATE";

interface BoardToolbarProps {
    currentView?: BoardViewMode;
    onViewChange?: (view: BoardViewMode) => void;
    searchQuery: string;
    onSearchChange: (value: string) => void;
    sortOption: SortOption;
    onSortChange: (value: SortOption) => void;
    boardId: string;
    onLabelsChange: () => void;
    priorityFilter: PriorityFilter;
    onPriorityFilterChange: (value: PriorityFilter) => void;
    dueDateFilter: DueDateFilter;
    onDueDateFilterChange: (value: DueDateFilter) => void;
    statusFilter: StatusFilter;
    onStatusFilterChange: (value: StatusFilter) => void;
    assigneeFilter?: string;
    onAssigneeFilterChange?: (value: string) => void;
    workspaceMembers?: WorkspaceMember[];
    currentUserId?: string | null;
}


export default function BoardToolbar({
    currentView = "board",
    onViewChange,
    searchQuery,
    onSearchChange,
    sortOption,
    onSortChange,
    boardId,
    onLabelsChange,
    priorityFilter,
    onPriorityFilterChange,
    dueDateFilter,
    onDueDateFilterChange,
    statusFilter,
    onStatusFilterChange,
    assigneeFilter = "ALL",
    onAssigneeFilterChange,
    workspaceMembers = [],
    currentUserId,
}: BoardToolbarProps) {
    const hasActiveFilters =
        searchQuery.trim().length > 0 ||
        priorityFilter !== "ALL" ||
        dueDateFilter !== "ALL" ||
        statusFilter !== "ALL" ||
        (assigneeFilter !== "ALL" && Boolean(assigneeFilter));

    const handleClearFilters = () => {
        onSearchChange("");
        onPriorityFilterChange("ALL");
        onDueDateFilterChange("ALL");
        onStatusFilterChange("ALL");
        onAssigneeFilterChange?.("ALL");
    };

    return (
        <div className="flex h-11 shrink-0 items-center gap-2 border-b px-3 bg-muted/10 overflow-x-auto">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg border bg-background/80 p-0.5 shadow-xs shrink-0">
                <button
                    type="button"
                    onClick={() => onViewChange?.("board")}
                    className={cn(
                        "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer",
                        currentView === "board"
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}
                    title="Board / Kanban View"
                >
                    <Columns3 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Board</span>
                </button>

                <button
                    type="button"
                    onClick={() => onViewChange?.("table")}
                    className={cn(
                        "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer",
                        currentView === "table"
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}
                    title="Table / List View"
                >
                    <Table2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Table</span>
                </button>

                <button
                    type="button"
                    onClick={() => onViewChange?.("calendar")}
                    className={cn(
                        "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer",
                        currentView === "calendar"
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}
                    title="Calendar View"
                >
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Calendar</span>
                </button>
            </div>

            <div className="h-4 w-px bg-border/60 shrink-0 hidden sm:block" />

            {/* Search */}
            <div className="relative w-36 sm:w-48 md:w-56 shrink-0">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />

                <Input
                    value={searchQuery}
                    onChange={(event) =>
                        onSearchChange(event.target.value)
                    }
                    placeholder="Search tasks..."
                    className="h-8 pl-8 pr-7 text-xs bg-background"
                />

                {searchQuery && (
                    <button
                        onClick={() => onSearchChange("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-3 w-3" />
                    </button>
                )}
            </div>

            {hasActiveFilters && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                    title="Clear all filters"
                >
                    <X className="mr-1 h-3 w-3" />
                    Reset
                </Button>
            )}

            <div className="ml-auto flex items-center gap-1">
                {/* Assignee Filter */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "h-8 text-xs",
                                assigneeFilter && assigneeFilter !== "ALL" && "text-primary font-medium bg-primary/10"
                            )}
                        >
                            <User className="mr-1.5 h-3.5 w-3.5" />
                            {assigneeFilter === "ALL" || !assigneeFilter
                                ? "Assignee"
                                : assigneeFilter === "ME"
                                ? "Assigned to me"
                                : workspaceMembers?.find((m) => m.userId === assigneeFilter || m.user.id === assigneeFilter)?.user.name || "Assignee"}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onAssigneeFilterChange?.("ALL")}>
                            All members
                        </DropdownMenuItem>
                        {currentUserId && (
                            <DropdownMenuItem onClick={() => onAssigneeFilterChange?.("ME")}>
                                Assigned to me
                            </DropdownMenuItem>
                        )}
                        {workspaceMembers && workspaceMembers.length > 0 && (
                            <>
                                <DropdownMenuSeparator />
                                {workspaceMembers.map((m) => (
                                    <DropdownMenuItem
                                        key={m.userId}
                                        onClick={() => onAssigneeFilterChange?.(m.userId)}
                                    >
                                        {m.user.name}
                                    </DropdownMenuItem>
                                ))}
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Filter */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                        >
                            <Filter className="mr-1.5 h-3.5 w-3.5" />
                            {statusFilter === "ALL" &&
                                priorityFilter === "ALL" &&
                                dueDateFilter === "ALL"
                                ? "Filter"
                                : [
                                    statusFilter !== "ALL"
                                        ? statusFilter === "ACTIVE"
                                            ? "Active"
                                            : "Completed"
                                        : null,

                                    priorityFilter !== "ALL"
                                        ? priorityFilter.charAt(0) +
                                        priorityFilter.slice(1).toLowerCase()
                                        : null,

                                    dueDateFilter !== "ALL"
                                        ? dueDateFilter === "OVERDUE"
                                            ? "Overdue"
                                            : dueDateFilter === "TODAY"
                                                ? "Today"
                                                : dueDateFilter === "THIS_WEEK"
                                                    ? "This week"
                                                    : "No date"
                                        : null,
                                ]
                                    .filter(Boolean)
                                    .join(" · ")}
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            onClick={() => onPriorityFilterChange("ALL")}
                        >
                            All priorities
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onClick={() => onPriorityFilterChange("LOW")}
                        >
                            Low
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onClick={() => onPriorityFilterChange("MEDIUM")}
                        >
                            Medium
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onClick={() => onPriorityFilterChange("HIGH")}
                        >
                            High
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onClick={() => onPriorityFilterChange("URGENT")}
                        >
                            Urgent
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onClick={() => onSearchChange("")}
                        >
                            Clear search
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => onDueDateFilterChange("ALL")}
                        >
                            All due dates
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onClick={() => onDueDateFilterChange("OVERDUE")}
                        >
                            Overdue
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onClick={() => onDueDateFilterChange("TODAY")}
                        >
                            Due today
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onClick={() => onDueDateFilterChange("THIS_WEEK")}
                        >
                            Due this week
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onClick={() => onDueDateFilterChange("NO_DATE")}
                        >
                            No due date
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => onStatusFilterChange("ALL")}
                        >
                            All tasks
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onClick={() => onStatusFilterChange("ACTIVE")}
                        >
                            Active
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onClick={() => onStatusFilterChange("COMPLETED")}
                        >
                            Completed
                        </DropdownMenuItem>
                    </DropdownMenuContent>

                </DropdownMenu>

                {/* Sort */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                        >
                            <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />

                            {sortOption === "position"
                                ? "Sort"
                                : sortOption === "title"
                                    ? "Sort: Title"
                                    : sortOption === "created"
                                        ? "Sort: Created"
                                        : sortOption === "dueDateAsc"
                                            ? "Sort: Due date ↑"
                                            : "Sort: Due date ↓"}
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            onClick={() =>
                                onSortChange("position")
                            }
                        >
                            Position
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onClick={() =>
                                onSortChange("title")
                            }
                        >
                            Title
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onClick={() =>
                                onSortChange("created")
                            }
                        >
                            Created date
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => onSortChange("dueDateAsc")}
                        >
                            Due date ↑
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onClick={() => onSortChange("dueDateDesc")}
                        >
                            Due date ↓
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Labels */}
                <LabelManager
                    boardId={boardId}
                    onLabelsChange={onLabelsChange}
                />
            </div>
        </div>
    );
}