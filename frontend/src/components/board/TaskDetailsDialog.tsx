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
    User,
    Maximize2,
    Minimize2,
} from "lucide-react";

import TaskLabelSelector from "./TaskLabelSelector";
import TaskAssigneeSelector from "./TaskAssigneeSelector";
import TaskComments from "./TaskComments";
import TaskActivity from "./TaskActivity";
import TaskSubtasks from "./TaskSubtasks";
import TaskAttachments from "./TaskAttachments";

import { type Task, updateTask } from "@/api/task.api";
import { resolveAssetUrl, setTaskCover } from "@/api/attachment.api";
import type { WorkspaceMember } from "@/api/workspace.api";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";

interface TaskDetailsDialogProps {
    task: Task | null;
    boardId: string;
    workspaceMembers?: WorkspaceMember[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEdit: () => void;
    onDelete: () => void;
    onLabelsChange: (labels: Task["labels"]) => void;
    onTaskUpdate?: (task: Task) => void;
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
    workspaceMembers = [],
    open,
    onOpenChange,
    onEdit,
    onDelete,
    onLabelsChange,
    onTaskUpdate,
}: TaskDetailsDialogProps) {
    const [activeTab, setActiveTab] = useState<"comments" | "activity">("comments");
    const [isExpanded, setIsExpanded] = useState<boolean>(() => {
        try {
            return localStorage.getItem("wabisabi_task_dialog_expanded") === "true";
        } catch {
            return false;
        }
    });

    if (!task) return null;

    const toggleExpanded = () => {
        setIsExpanded((prev) => {
            const next = !prev;
            try {
                localStorage.setItem("wabisabi_task_dialog_expanded", String(next));
            } catch {
                // Ignore storage errors
            }
            return next;
        });
    };

    const handleAssigneeChange = async (userId: string | null) => {
        try {
            const updated = await updateTask(task.id, { assigneeId: userId });
            onTaskUpdate?.(updated);
        } catch (err) {
            console.error("Failed to update task assignee:", err);
        }
    };

    const handleCoverChange = async (newCoverUrl: string | null) => {
        try {
            await setTaskCover(task.id, newCoverUrl);
            const updated = { ...task, coverUrl: newCoverUrl };
            onTaskUpdate?.(updated);
        } catch (err) {
            console.error("Failed to update task cover:", err);
        }
    };

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
            <DialogContent
                className={cn(
                    "p-0 gap-0 overflow-hidden flex flex-col transition-all duration-200 border shadow-2xl",
                    "w-[95vw] max-h-[90vh] max-h-[90dvh]",
                    isExpanded
                        ? "sm:max-w-5xl md:max-w-6xl h-[92vh] max-h-[92dvh]"
                        : "sm:max-w-[760px] md:max-w-[820px] max-h-[90dvh]"
                )}
            >
                {/* Hero Cover Image */}
                {task.coverUrl && (
                    <div className="relative w-full h-32 sm:h-36 md:h-40 max-h-[22vh] shrink-0 bg-muted/60 overflow-hidden group">
                        <img
                            src={resolveAssetUrl(task.coverUrl)}
                            alt="Task cover"
                            className="h-full w-full object-cover"
                        />
                        <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <Button
                                variant="secondary"
                                size="sm"
                                className="h-7 text-xs bg-background/80 backdrop-blur-xs hover:bg-background shadow-xs cursor-pointer"
                                onClick={() => handleCoverChange(null)}
                            >
                                Remove cover
                            </Button>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="shrink-0 flex items-start justify-between gap-3 px-5 sm:px-6 pt-5 pb-4 border-b bg-card/60 backdrop-blur-xs">
                    <div className="flex-1 min-w-0 pr-2">
                        <DialogTitle className="text-base sm:text-lg font-semibold leading-snug break-words">
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

                    {/* Action buttons + adjust size toggle */}
                    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 mr-7 sm:mr-8">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={toggleExpanded}
                            className="h-8 px-2 sm:px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                            title={isExpanded ? "Collapse to standard size" : "Expand to wide view"}
                        >
                            {isExpanded ? (
                                <Minimize2 className="h-3.5 w-3.5" />
                            ) : (
                                <Maximize2 className="h-3.5 w-3.5" />
                            )}
                            <span className="hidden md:inline ml-1.5 font-medium">
                                {isExpanded ? "Collapse" : "Expand"}
                            </span>
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onEdit}
                            className="h-8 px-2 sm:px-2.5 text-xs cursor-pointer"
                        >
                            <Pencil className="mr-1 sm:mr-1.5 h-3.5 w-3.5" />
                            <span className="hidden xs:inline">Edit</span>
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                            onClick={onDelete}
                            title="Delete task"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 min-h-0 overflow-y-auto md:overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border">
                    {/* Left: Description + Checklist + Attachments + Comments/Activity */}
                    <div className="flex-1 min-h-0 md:overflow-y-auto px-5 sm:px-6 py-4 sm:py-5 space-y-6">
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
                                    className="w-full text-left rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground hover:bg-muted/40 transition-colors cursor-pointer"
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

                        {/* Attachments & Cover */}
                        <div>
                            <TaskAttachments
                                taskId={task.id}
                                coverUrl={task.coverUrl}
                                onCoverChange={handleCoverChange}
                            />
                        </div>

                        {/* Comments / Activity tabs */}
                        <div className="pt-2">
                            <div className="flex items-center gap-1 border-b mb-3">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("comments")}
                                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
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
                                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
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

                    {/* Right sidebar: Assignee & Labels */}
                    <div
                        className={cn(
                            "shrink-0 md:overflow-y-auto px-5 py-4 sm:py-5 space-y-6 bg-muted/15",
                            isExpanded ? "w-full md:w-72 lg:w-80" : "w-full md:w-60 lg:w-64"
                        )}
                    >
                        <div>
                            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                <User className="h-3.5 w-3.5" />
                                Assignee
                            </h4>
                            <TaskAssigneeSelector
                                members={workspaceMembers}
                                assigneeId={task.assigneeId}
                                assignee={task.assignee}
                                onAssign={handleAssigneeChange}
                            />
                        </div>

                        <div>
                            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                <Tag className="h-3.5 w-3.5" />
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