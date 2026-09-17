
import {
    CalendarDays,
    Pencil,
    Trash2,
} from "lucide-react";

import type { Task } from "@/api/task.api";

import { Button } from "@/components/ui/button";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface TaskDetailsDialogProps {
    task: Task | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEdit: () => void;
    onDelete: () => void;
}

const priorityConfig = {
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

export default function TaskDetailsDialog({
    task,
    open,
    onOpenChange,
    onEdit,
    onDelete,
}: TaskDetailsDialogProps) {
    if (!task) {
        return null;
    }

    const priority = priorityConfig[task.priority];

    const formattedDueDate = task.dueDate
        ? new Date(task.dueDate).toLocaleDateString(undefined, {
              day: "numeric",
              month: "long",
              year: "numeric",
          })
        : null;

    const isOverdue =
        task.dueDate &&
        new Date(task.dueDate).getTime() < Date.now();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <div className="flex items-start justify-between gap-4 pr-6">
                        <div className="min-w-0">
                            <DialogTitle className="text-xl leading-7">
                                {task.title}
                            </DialogTitle>

                            <DialogDescription className="mt-1">
                                Task details
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Description */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium">
                            Description
                        </h4>

                        {task.description ? (
                            <p className="whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-sm leading-6 text-muted-foreground">
                                {task.description}
                            </p>
                        ) : (
                            <p className="text-sm italic text-muted-foreground">
                                No description added.
                            </p>
                        )}
                    </div>

                    {/* Task information */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Priority */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium">
                                Priority
                            </h4>

                            <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${priority.className}`}
                            >
                                {priority.label}
                            </span>
                        </div>

                        {/* Due date */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium">
                                Due date
                            </h4>

                            {formattedDueDate ? (
                                <div
                                    className={`flex items-center gap-2 text-sm ${
                                        isOverdue
                                            ? "text-destructive"
                                            : "text-muted-foreground"
                                    }`}
                                >
                                    <CalendarDays className="h-4 w-4" />
                                    <span>
                                        {formattedDueDate}
                                    </span>

                                    {isOverdue && (
                                        <span className="text-xs font-medium">
                                            Overdue
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm italic text-muted-foreground">
                                    No due date
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="rounded-md border bg-muted/20 p-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Task ID
                                </p>
                                <p className="mt-1 font-mono text-xs">
                                    {task.id}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Created
                                </p>
                                <p className="mt-1 text-sm">
                                    {new Date(
                                        task.createdAt,
                                    ).toLocaleDateString(undefined, {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:justify-between">
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={onDelete}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </Button>

                    <Button
                        type="button"
                        onClick={onEdit}
                    >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Task
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}