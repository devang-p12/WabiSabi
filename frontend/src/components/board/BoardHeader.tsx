import {
    ArrowLeft,
    Circle,
    MoreHorizontal,
    Plus,
    UserPlus,
} from "lucide-react";

import type { Board } from "@/api/board.api";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import OnlineMembers, { type BoardUserPresence } from "./OnlineMembers";
import NotificationBell from "../notifications/NotificationBell";
import CommandTriggerButton from "../command/CommandTriggerButton";

interface BoardHeaderProps {
    board: Board;
    onBack?: () => void;
    onAddTask: () => void;
    onAddList: () => void;
    onRefresh: () => void;
    canAddTask: boolean;
    onlineMembers?: BoardUserPresence[];
    currentUserId?: string | null;
}

export default function BoardHeader({
    board,
    onBack,
    onAddTask,
    onAddList,
    onRefresh,
    canAddTask,
    onlineMembers,
    currentUserId,
}: BoardHeaderProps) {
    return (
        <div className="flex h-14 shrink-0 items-center justify-between gap-4 border-b px-2">
            {/* Left */}
            <div className="flex min-w-0 items-center gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onBack}
                    className="h-8 w-8 shrink-0"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>

                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <Circle className="h-4 w-4 text-primary" />
                </div>

                <div className="flex min-w-0 items-center gap-2">
                    <h1 className="truncate text-base font-semibold">
                        {board.name}
                    </h1>

                    <Badge
                        variant="secondary"
                        className="hidden shrink-0 sm:inline-flex"
                    >
                        Board
                    </Badge>

                    {board.description && (
                        <>
                            <span className="hidden text-muted-foreground sm:inline">
                                /
                            </span>

                            <span className="hidden max-w-[300px] truncate text-sm text-muted-foreground md:inline">
                                {board.description}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Right */}
            <div className="flex shrink-0 items-center gap-2">
                <CommandTriggerButton />

                <OnlineMembers
                    members={onlineMembers || []}
                    currentUserId={currentUserId}
                />

                <NotificationBell />

                <Button
                    variant="outline"
                    size="sm"
                    className="ml-1 h-8"
                >
                    <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                    Share
                </Button>

                <Button
                    size="sm"
                    className="h-8"
                    disabled={!canAddTask}
                    onClick={onAddTask}
                >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add task
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={onRefresh}>
                            Refresh board
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem onClick={onAddList}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add list
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}