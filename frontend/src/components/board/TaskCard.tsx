import {
    MoreHorizontal,
    Pencil,
    Trash2,
    GripVertical,
} from "lucide-react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { Task, TaskPriority } from "@/api/task.api";

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

const priorityConfig: Record<
    TaskPriority,
    {
        label: string;
        className: string;
    }
> = {
    LOW: {
        label: "Low",
        className:
            "bg-muted text-muted-foreground",
    },
    MEDIUM: {
        label: "Medium",
        className:
            "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    },
    HIGH: {
        label: "High",
        className:
            "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
    },
    URGENT: {
        label: "Urgent",
        className:
            "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    },
};

export default function TaskCard({
    task,
    onEdit,
    onDelete,
}: TaskCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: transition ?? undefined,
        opacity: isDragging ? 0 : 1,
    };

    const priority = priorityConfig[task.priority];

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="group rounded-lg border bg-background p-3 shadow-sm transition-shadow hover:shadow-md"
        >
            <div className="flex items-start gap-2">
                <button
                    type="button"
                    {...attributes}
                    {...listeners}
                    className="mt-0.5 flex h-6 w-5 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100 active:cursor-grabbing"
                    aria-label={`Drag ${task.title}`}
                >
                    <GripVertical className="h-4 w-4" />
                </button>

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

            <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-[10px] text-muted-foreground">
                    #{task.id.slice(0, 6)}
                </span>

                <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${priority.className}`}
                >
                    {priority.label}
                </span>
            </div>
        </div>
    );
}