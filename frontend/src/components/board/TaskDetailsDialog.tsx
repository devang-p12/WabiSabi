import { useState } from "react";
import {
    CalendarDays,
    Pencil,
    Trash2,
    Tag,
    AlertCircle,
    Clock,
    MessageSquare,
    Activity,
} from "lucide-react";

import TaskLabelSelector from "./TaskLabelSelector";
import TaskComments from "./TaskComments";
import TaskActivity from "./TaskActivity";
import TaskSubtasks from "./TaskSubtasks";

import type { Task } from "@/api/task.api";

import { Button } from "@/components/ui/button";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";

interface TaskDetailsDialogProps {
    task: Task | null;
    boardId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEdit: () => void;
    onDelete: () => void;
    onLabelsChange: (labels: Task["labels"]) => void;
}

const priorityConfig = {
    LOW: {
        label: "Low",
        className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
        dot: "bg-slate-400",
    },
    MEDIUM: {
        label: "Medium",
        className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
        dot: "bg-blue-500",
    },
    HIGH: {
        label: "High",
        className: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
        dot: "bg-orange-500",
    },
    URGENT: {
        label: "Urgent",
        className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
        dot: "bg-red-500",
    },
};

export default function TaskDetailsDialog({
    task,
    boardId,
    open,
    onOpenChange,
    onEdit,
    onDelete,
    onLabelsChange,
}: TaskDetailsDialogProps) {
    const [activeTab, setActiveTab] = useState<"comments" | "activity">("comments");

    if (!task) return null;

    const priority = priorityConfig[task.priority];

    const formattedDueDate = task.dueDate
        ? new Date(task.dueDate).toLocaleDateString(undefined, {
            day: "numeric",
            month: "short",
            year: "numeric",
        })
        : null;

    const isOverdue =
        task.dueDate && new Date(task.dueDate).getTime() < Date.now();

    const createdDate = new Date(task.createdAt).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] p-0 gap-0 overflow-hidden">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b">
                    <div className="flex-1 min-w-0">
                        <DialogTitle className="text-lg font-semibold leading-tight">
                            {task.title}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Task details
                        </DialogDescription>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {/* Priority badge */}
                            <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${priority.className}`}
                            >
                                <span className={`h-1.5 w-1.5 rounded-full ${priority.dot}`} />
                                {priority.label} priority
                            </span>

                            {/* Due date badge */}
                            {formattedDueDate ? (
                                <span
                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                        isOverdue
                                            ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                                            : "bg-muted text-muted-foreground"
                                    }`}
                                >
                                    {isOverdue ? (
                                        <AlertCircle className="h-3 w-3" />
                                    ) : (
                                        <CalendarDays className="h-3 w-3" />
                                    )}
                                    {isOverdue ? "Overdue · " : ""}{formattedDueDate}
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                                    <CalendarDays className="h-3 w-3" />
                                    No due date
                                </span>
                            )}

                            {/* Created at */}
                            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                Created {createdDate}
                            </span>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onEdit}
                        >
                            <Pencil className="mr-1.5 h-3.5 w-3.5" />
                            Edit
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={onDelete}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex flex-col sm:flex-row overflow-hidden" style={{ maxHeight: "65vh" }}>
                    {/* Left: Description + Comments/Activity */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                        {/* Description */}
                        <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                Description
                            </h4>
                            {task.description ? (
                                <div
                                    className="prose prose-sm dark:prose-invert max-w-none rounded-lg bg-muted/40 px-4 py-3"
                                    dangerouslySetInnerHTML={{ __html: task.description }}
                                />
                            ) : (
                                <button
                                    type="button"
                                    onClick={onEdit}
                                    className="w-full text-left rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground hover:bg-muted/40 transition-colors"
                                >
                                    + Add a description…
                                </button>
                            )}
                        </div>

                        {/* Subtasks / Checklist */}
                        <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                Checklist
                            </h4>
                            <TaskSubtasks taskId={task.id} />
                        </div>

                        {/* Comments / Activity tabs */}
                        <div>
                            <div className="flex items-center gap-1 border-b mb-3">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("comments")}
                                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                                        activeTab === "comments"
                                            ? "border-primary text-primary"
                                            : "border-transparent text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    <MessageSquare className="h-3.5 w-3.5" />
                                    Comments
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("activity")}
                                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                                        activeTab === "activity"
                                            ? "border-primary text-primary"
                                            : "border-transparent text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    <Activity className="h-3.5 w-3.5" />
                                    Activity
                                </button>
                            </div>

                            {activeTab === "comments" ? (
                                <TaskComments taskId={task.id} />
                            ) : (
                                <TaskActivity taskId={task.id} />
                            )}
                        </div>
                    </div>

                    {/* Right sidebar: Labels */}
                    <div className="sm:w-52 shrink-0 border-t sm:border-t-0 sm:border-l overflow-y-auto px-4 py-4 space-y-4 bg-muted/20">
                        <div>
                            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                <Tag className="h-3 w-3" />
                                Labels
                            </h4>
                            <TaskLabelSelector
                                task={task}
                                boardId={boardId}
                                onLabelsChange={onLabelsChange}
                            />
                            {task.labels.length === 0 && (
                                <p className="text-xs text-muted-foreground mt-2">
                                    No labels assigned. Click "+ Label" to add one.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}