import {
    MoreHorizontal,
    Pencil,
    Trash2,
} from "lucide-react";

import type { Task } from "@/api/task.api";

import { Button } from "@/components/ui/button";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TaskCardProps {
    task: Task;
    onEdit: () => void;
    onDelete: () => void;
}

export default function TaskCard({
    task,
    onEdit,
    onDelete,
}: TaskCardProps) {
    return (
        <div className="group rounded-lg border bg-background p-3 shadow-sm transition-shadow hover:shadow-md">

            <div className="flex items-start justify-between gap-2">

                <div className="min-w-0 flex-1">

                    <h3 className="text-sm font-medium leading-5">
                        {task.title}
                    </h3>

                    {task.description && (
                        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                            {task.description}
                        </p>
                    )}

                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">

                        <DropdownMenuItem onClick={onEdit}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                            onClick={onDelete}
                            className="text-destructive focus:text-destructive"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>

                    </DropdownMenuContent>
                </DropdownMenu>

            </div>

            <div className="mt-3 flex items-center justify-between">

                <span className="text-[10px] text-muted-foreground">
                    #{task.id.slice(0, 6)}
                </span>

                <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />

            </div>
        </div>
    );
}