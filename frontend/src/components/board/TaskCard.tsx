import {
    MoreHorizontal,
    Pencil,
    Trash2,
    CalendarDays,
    ListChecks,
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
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TaskCardProps {
    task: Task;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onCompletedChange: (task: Task) => void;
    remoteDraggingInfo?: { userName: string; color: string } | null;
}

const priorityConfig: Record<
    TaskPriority,
    { label: string; className: string }
> = {
    LOW: {
        label: "Low",
        className: "bg-muted text-muted-foreground",
    },
    MEDIUM: {
        label: "Medium",
        className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    },
    HIGH: {
        label: "High",
        className: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
    },
    URGENT: {
        label: "Urgent",
        className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    },
};

export default function TaskCard({
    task,
    onView,
    onEdit,
    onDelete,
    onCompletedChange,
    remoteDraggingInfo,
}: TaskCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: transition ?? undefined,
        ...(remoteDraggingInfo ? { borderColor: remoteDraggingInfo.color } : {}),
    };

    const priority = priorityConfig[task.priority];

    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDay = dueDate ? new Date(dueDate) : null;
    if (dueDay) dueDay.setHours(0, 0, 0, 0);

    const isOverdue = dueDay !== null && dueDay < today;
    const isDueToday =
        dueDay !== null && dueDay.getTime() === today.getTime();

    const formattedDueDate = dueDate
        ? dueDate.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
        })
        : null;

    const handleCompletedChange = async (
        event: React.MouseEvent<HTMLButtonElement>,
    ) => {
        // Stop propagation so neither drag nor onView fires
        event.stopPropagation();
        try {
            const updatedTask = await updateTask(task.id, {
                completed: !task.completed,
            });
            onCompletedChange(updatedTask);
        } catch (error) {
            console.error("Failed to update task completion:", error);
        }
    };

    // When this card is being dragged, render a placeholder in its slot.
    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={{ ...style, minHeight: 72 }}
                className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/5"
            />
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            // Spread drag listeners on the whole card
            {...listeners}
            {...attributes}
            // Only open details on a real click (not after a drag)
            onClick={onView}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onView();
                }
            }}
            className={`group cursor-grab rounded-lg border bg-background p-3 shadow-sm transition-all hover:shadow-md active:cursor-grabbing ${
                remoteDraggingInfo
                    ? "ring-2 ring-offset-1 scale-[1.01] shadow-md"
                    : ""
            }`}
        >
            {/* Remote collaborator dragging badge */}
            {remoteDraggingInfo && (
                <div
                    className="mb-2.5 flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm w-fit animate-pulse select-none"
                    style={{ backgroundColor: remoteDraggingInfo.color }}
                >
                    <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                    </span>
                    <span>{remoteDraggingInfo.userName} is moving this</span>
                </div>
            )}

            <div className="flex items-start gap-2">
                {/* Completion checkbox — stopPropagation prevents drag from starting here */}
                <button
                    type="button"
                    onClick={handleCompletedChange}
                    onPointerDown={(e) => e.stopPropagation()}
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
                                task.completed ? "line-through opacity-70" : ""
                            }`}
                        >
                            {task.description.replace(/<[^>]+>/g, ' ').trim()}
                        </p>
                    )}

                    {task.labels.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {task.labels.map((label) => (
                                <span
                                    key={label.id}
                                    className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                                    style={{ backgroundColor: label.color }}
                                >
                                    {label.name}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Dropdown menu — stopPropagation on both pointer and click so drag never starts here */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        align="end"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit();
                            }}
                        >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                            className="text-destructive focus:text-destructive"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
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
                    {task.subtasks && task.subtasks.length > 0 && (
                        <span className={`flex items-center gap-1 text-[10px] font-medium ${
                            task.subtasks.every(s => s.completed) ? "text-primary" : "text-muted-foreground"
                        }`}>
                            <ListChecks className="h-3 w-3" />
                            {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
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