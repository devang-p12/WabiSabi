import {
    Filter,
    Search,
    SlidersHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LabelManager from "./LabelManager";

export type SortOption =
    | "position"
    | "title"
    | "created";

interface BoardToolbarProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    sortOption: SortOption;
    onSortChange: (value: SortOption) => void;
    boardId: string;
    onLabelsChange: () => void;
    priorityFilter: PriorityFilter;
    onPriorityFilterChange: (value: PriorityFilter) => void;
}

export type PriorityFilter = "ALL" | "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export default function BoardToolbar({
    searchQuery,
    onSearchChange,
    sortOption,
    onSortChange,
    boardId,
    onLabelsChange,
    priorityFilter,
    onPriorityFilterChange,
}: BoardToolbarProps) {
    return (
        <div className="flex h-10 shrink-0 items-center gap-1 border-b px-2">
            {/* Search */}
            <div className="relative hidden w-48 lg:block">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />

                <Input
                    value={searchQuery}
                    onChange={(event) =>
                        onSearchChange(event.target.value)
                    }
                    placeholder="Search tasks..."
                    className="h-8 pl-8 text-xs"
                />
            </div>

            <div className="ml-auto flex items-center gap-1">
                {/* Filter */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                        >
                            <Filter className="mr-1.5 h-3.5 w-3.5" />
                            Filter
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
                            Sort
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