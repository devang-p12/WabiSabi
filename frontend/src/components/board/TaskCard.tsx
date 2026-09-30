import {
    MoreHorizontal,
    Pencil,
    Trash2,
    GripVertical,
    CalendarDays,
} from "lucide-react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import {
    updateTask,
    type Task,
    type TaskPriority,
} from "@/api/task.api";

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
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onCompletedChange: (task: Task) => void;
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
    onView,
    onEdit,
    onDelete,
    onCompletedChange,
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

    const dueDate = task.dueDate
        ? new Date(task.dueDate)
        : null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDay = dueDate
        ? new Date(dueDate)
        : null;

    if (dueDay) {
        dueDay.setHours(0, 0, 0, 0);
    }

    const isOverdue =
        dueDay !== null &&
        dueDay < today;

    const isDueToday =
        dueDay !== null &&
        dueDay.getTime() === today.getTime();

    const formattedDueDate = dueDate
        ? dueDate.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
        })
        : null;

    const handleCompletedChange = async (
        event: React.MouseEvent<HTMLButtonElement>
    ) => {
        event.stopPropagation();

        try {
            const updatedTask = await updateTask(task.id, {
                completed: !task.completed,
            });

            onCompletedChange(updatedTask);
        } catch (error) {
            console.error(
                "Failed to update task completion:",
                error
            );
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={onView}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onView();
                }
            }}
            className="group cursor-pointer rounded-lg border bg-background p-3 shadow-sm transition-shadow hover:shadow-md"
        >
            <div className="flex items-start gap-2">
                <button
                    type="button"
                    {...attributes}
                    {...listeners}
                    onClick={(event) => event.stopPropagation()}
                    className="mt-0.5 flex h-6 w-5 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100 active:cursor-grabbing"
                    aria-label={`Drag ${task.title}`}
                >
                    <GripVertical className="h-4 w-4" />
                </button>

                {/* Completion checkbox */}
                <button
                    type="button"
                    onClick={handleCompletedChange}
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                        task.completed
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                    }`}
                    aria-label={
                        task.completed
                            ? "Mark task incomplete"
                            : "Mark task complete"
                    }
                >
                    {task.completed && (
                        <span className="text-xs">✓</span>
                    )}
                </button>

                <div className="min-w-0 flex-1">
                    {/* Task title */}
                    <h3
                        className={`text-sm font-medium leading-5 ${
                            task.completed
                                ? "text-muted-foreground line-through"
                                : ""
                        }`}
                    >
                        {task.title}
                    </h3>

                    {/* Task description */}
                    {task.description && (
                        <p
                            className={`mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground ${
                                task.completed
                                    ? "line-through opacity-70"
                                    : ""
                            }`}
                        >
                            {task.description}
                        </p>
                    )}

                    {task.labels.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {task.labels.map((label) => (
                                <span
                                    key={label.id}
                                    className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                                    style={{
                                        backgroundColor: label.color,
                                    }}
                                >
                                    {label.name}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onPointerDown={(event) => {
                                event.stopPropagation();
                            }}
                            onClick={(event) => {
                                event.stopPropagation();
                            }}
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        align="end"
                        onPointerDown={(event) => {
                            event.stopPropagation();
                        }}
                        onClick={(event) => {
                            event.stopPropagation();
                        }}
                    >
                        <DropdownMenuItem
                            onPointerDown={(event) => {
                                event.stopPropagation();
                            }}
                            onClick={(event) => {
                                event.stopPropagation();
                                onEdit();
                            }}
                        >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onPointerDown={(event) => {
                                event.stopPropagation();
                            }}
                            onClick={(event) => {
                                event.stopPropagation();
                                onDelete();
                            }}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">
                        #{task.id.slice(0, 6)}
                    </span>

                    {formattedDueDate && (
                        <span
                            className={`flex items-center gap-1 text-[10px] font-medium ${
                                isOverdue
                                    ? "text-destructive"
                                    : isDueToday
                                        ? "text-orange-600 dark:text-orange-400"
                                        : "text-muted-foreground"
                            }`}
                        >
                            <CalendarDays className="h-3 w-3" />

                            {isOverdue
                                ? `Overdue · ${formattedDueDate}`
                                : isDueToday
                                    ? `Today · ${formattedDueDate}`
                                    : formattedDueDate}
                        </span>
                    )}
                </div>

                <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${priority.className}`}
                >
                    {priority.label}
                </span>
            </div>
        </div>
    );
}