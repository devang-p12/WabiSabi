import { useState } from "react";
import {
    Calendar,
    CheckCircle2,
    Circle,
    ChevronDown,
    ChevronRight,
    FileText,
    MoreHorizontal,
    Pencil,
    Plus,
    Trash2,
    AlertCircle,
    ListTodo,
} from "lucide-react";
import { cn } from "cn";

import type { BoardList } from "@/api/list.api";
import type { Task, TaskPriority } from "@/api/task.api";
import type { WorkspaceMember } from "@/api/workspace.api";
import TaskAssigneeSelector from "./TaskAssigneeSelector";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";

interface BoardTableViewProps {
    lists: BoardList[];
    tasks: Record<string, Task[]>;
    getVisibleTasks: (tasks: Task[]) => Task[];
    onViewTask: (task: Task) => void;
    onEditTask: (task: Task) => void;
    onDeleteTask: (task: Task) => void;
    onCompletedChange: (task: Task) => void;
    onMoveTask: (taskId: string, targetListId: string, position: number) => Promise<any>;
    onUpdatePriority: (taskId: string, priority: TaskPriority) => Promise<any>;
    onAssignTask?: (taskId: string, userId: string | null) => Promise<any>;
    onAddTask: (list: BoardList) => void;
    workspaceMembers?: WorkspaceMember[];
    onCreateStarterColumns?: () => void;
    isCreatingStarters?: boolean;
}

const priorityConfig: Record<
    TaskPriority,
    { label: string; dot: string; badge: string }
> = {
    LOW: {
        label: "Low",
        dot: "bg-slate-400 dark:bg-slate-500",
        badge: "text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-800",
    },
    MEDIUM: {
        label: "Medium",
        dot: "bg-blue-500",
        badge: "text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-950/60",
    },
    HIGH: {
        label: "High",
        dot: "bg-amber-500",
        badge: "text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-950/60",
    },
    URGENT: {
        label: "Urgent",
        dot: "bg-rose-500",
        badge: "text-rose-700 bg-rose-100 dark:text-rose-300 dark:bg-rose-950/60",
    },
};

export default function BoardTableView({
    lists,
    tasks,
    getVisibleTasks,
    onViewTask,
    onEditTask,
    onDeleteTask,
    onCompletedChange,
    onMoveTask,
    onUpdatePriority,
    onAssignTask,
    onAddTask,
    workspaceMembers = [],
    onCreateStarterColumns,
    isCreatingStarters,
}: BoardTableViewProps) {
    // Collapsed list groups state
    const [collapsedLists, setCollapsedLists] = useState<Record<string, boolean>>({});

    const toggleListCollapse = (listId: string) => {
        setCollapsedLists((prev) => ({
            ...prev,
            [listId]: !prev[listId],
        }));
    };

    const sortedLists = [...lists].sort((a, b) => a.position - b.position);

    // Calculate overall stats
    let totalAllTasks = 0;
    let completedAllTasks = 0;

    for (const list of sortedLists) {
        const listTasks = tasks[list.id] ?? [];
        totalAllTasks += listTasks.length;
        completedAllTasks += listTasks.filter((t) => t.completed).length;
    }

    const completionRate =
        totalAllTasks > 0 ? Math.round((completedAllTasks / totalAllTasks) * 100) : 0;

    if (sortedLists.length === 0) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground mb-4">
                    <ListTodo className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">No columns in this board</h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Create your first column or generate starter columns to view tasks in table format.
                </p>
                {onCreateStarterColumns && (
                    <Button
                        onClick={onCreateStarterColumns}
                        disabled={isCreatingStarters}
                        className="mt-4"
                    >
                        {isCreatingStarters ? "Creating..." : "Add Starter Columns"}
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col overflow-hidden bg-background">
            {/* Table Header Bar */}
            <div className="border-b bg-muted/20 px-4 py-2.5">
                <div className="grid grid-cols-12 items-center gap-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <div className="col-span-4 sm:col-span-3 flex items-center gap-2">
                        <span>Task</span>
                    </div>
                    <div className="col-span-2 hidden md:block">
                        <span>Status</span>
                    </div>
                    <div className="col-span-2 sm:col-span-2">
                        <span>Priority</span>
                    </div>
                    <div className="col-span-2 hidden sm:block">
                        <span>Assignee</span>
                    </div>
                    <div className="col-span-2 sm:col-span-2">
                        <span>Due Date</span>
                    </div>
                    <div className="col-span-2 hidden xl:block">
                        <span>Labels & Subtasks</span>
                    </div>
                    <div className="col-span-2 sm:col-span-2 md:col-span-2 lg:col-span-1 text-right">
                        <span>Actions</span>
                    </div>
                </div>
            </div>

            {/* Table Rows Body */}
            <div className="flex-1 overflow-y-auto divide-y divide-border/60">
                {sortedLists.map((list) => {
                    const listTasks = tasks[list.id] ?? [];
                    const visibleTasks = getVisibleTasks(listTasks);
                    const isCollapsed = Boolean(collapsedLists[list.id]);

                    return (
                        <div key={list.id} className="bg-background">
                            {/* List Group Header */}
                            <div className="sticky top-0 z-10 flex items-center justify-between border-y bg-muted/40 backdrop-blur-sm px-4 py-2 transition-colors hover:bg-muted/60">
                                <div className="flex items-center gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => toggleListCollapse(list.id)}
                                        className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                                        title={isCollapsed ? "Expand list" : "Collapse list"}
                                    >
                                        {isCollapsed ? (
                                            <ChevronRight className="h-4 w-4" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4" />
                                        )}
                                    </button>

                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm tracking-tight">
                                            {list.name}
                                        </span>
                                        <Badge variant="secondary" className="h-5 px-1.5 text-[11px] font-normal">
                                            {visibleTasks.length}
                                        </Badge>
                                    </div>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onAddTask(list)}
                                    className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    <span>Add task</span>
                                </Button>
                            </div>

                            {/* List Tasks Rows */}
                            {!isCollapsed && (
                                <div className="divide-y divide-border/40">
                                    {visibleTasks.length === 0 ? (
                                        <div className="flex items-center justify-between py-3 px-6 text-xs text-muted-foreground bg-muted/5">
                                            <span>No tasks in this column</span>
                                            <Button
                                                variant="link"
                                                size="sm"
                                                onClick={() => onAddTask(list)}
                                                className="h-auto p-0 text-xs text-primary"
                                            >
                                                + Add a task
                                            </Button>
                                        </div>
                                    ) : (
                                        visibleTasks.map((task) => {
                                            const priorityInfo = priorityConfig[task.priority] || priorityConfig.MEDIUM;
                                            const isOverdue =
                                                task.dueDate &&
                                                !task.completed &&
                                                new Date(task.dueDate).getTime() < Date.now();

                                            const completedSubtasks =
                                                task.subtasks?.filter((s) => s.completed).length ?? 0;
                                            const totalSubtasks = task.subtasks?.length ?? 0;

                                            return (
                                                <div
                                                    key={task.id}
                                                    className={cn(
                                                        "group grid grid-cols-12 items-center gap-4 px-4 py-2.5 text-sm transition-colors hover:bg-muted/40",
                                                        task.completed && "bg-muted/10 opacity-75"
                                                    )}
                                                >
                                                    {/* Title & Checkbox */}
                                                    <div className="col-span-5 sm:col-span-4 flex items-center gap-2.5 min-w-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => onCompletedChange(task)}
                                                            className="text-muted-foreground hover:text-primary transition-colors shrink-0 cursor-pointer"
                                                            title={task.completed ? "Mark incomplete" : "Mark completed"}
                                                        >
                                                            {task.completed ? (
                                                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                            ) : (
                                                                <Circle className="h-4 w-4" />
                                                            )}
                                                        </button>

                                                        <div
                                                            onClick={() => onViewTask(task)}
                                                            className="flex items-center gap-2 min-w-0 cursor-pointer flex-1"
                                                        >
                                                            <span
                                                                className={cn(
                                                                    "truncate font-medium hover:underline hover:text-primary transition-colors",
                                                                    task.completed && "line-through text-muted-foreground font-normal"
                                                                )}
                                                            >
                                                                {task.title}
                                                            </span>

                                                            {task.description && (
                                                                <span title="Has description" className="inline-flex items-center">
                                                                    <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Status / List dropdown */}
                                                    <div className="col-span-2 hidden md:flex items-center">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <button
                                                                    type="button"
                                                                    className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                                                                >
                                                                    <span className="truncate max-w-[100px]">{list.name}</span>
                                                                    <ChevronDown className="h-3 w-3 opacity-50 shrink-0" />
                                                                </button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="start">
                                                                {sortedLists.map((l) => (
                                                                    <DropdownMenuItem
                                                                        key={l.id}
                                                                        disabled={l.id === list.id}
                                                                        onClick={() => onMoveTask(task.id, l.id, 0)}
                                                                        className="text-xs"
                                                                    >
                                                                        Move to <strong className="ml-1">{l.name}</strong>
                                                                    </DropdownMenuItem>
                                                                ))}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>

                                                    {/* Priority dropdown */}
                                                    <div className="col-span-2 sm:col-span-2 flex items-center">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <button
                                                                    type="button"
                                                                    className={cn(
                                                                        "flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium transition-colors cursor-pointer",
                                                                        priorityInfo.badge
                                                                    )}
                                                                >
                                                                    <span className={cn("h-1.5 w-1.5 rounded-full", priorityInfo.dot)} />
                                                                    <span>{priorityInfo.label}</span>
                                                                </button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="start">
                                                                {(["LOW", "MEDIUM", "HIGH", "URGENT"] as TaskPriority[]).map((p) => (
                                                                    <DropdownMenuItem
                                                                        key={p}
                                                                        onClick={() => onUpdatePriority(task.id, p)}
                                                                        className="flex items-center gap-2 text-xs"
                                                                    >
                                                                        <span className={cn("h-2 w-2 rounded-full", priorityConfig[p].dot)} />
                                                                        <span>{priorityConfig[p].label}</span>
                                                                    </DropdownMenuItem>
                                                                ))}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>

                                                    {/* Assignee */}
                                                    <div className="col-span-2 hidden sm:flex items-center">
                                                        <TaskAssigneeSelector
                                                            compact
                                                            members={workspaceMembers}
                                                            assigneeId={task.assigneeId}
                                                            assignee={task.assignee}
                                                            onAssign={(userId) => onAssignTask?.(task.id, userId)}
                                                        />
                                                    </div>

                                                    {/* Due Date */}
                                                    <div className="col-span-3 sm:col-span-2 flex items-center gap-1.5 text-xs">
                                                        {task.dueDate ? (
                                                            <div
                                                                className={cn(
                                                                    "flex items-center gap-1 font-medium",
                                                                    isOverdue
                                                                        ? "text-rose-600 dark:text-rose-400 font-semibold"
                                                                        : task.completed
                                                                        ? "text-muted-foreground"
                                                                        : "text-foreground"
                                                                )}
                                                            >
                                                                {isOverdue && <AlertCircle className="h-3 w-3 shrink-0" />}
                                                                <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                                                <span>
                                                                    {new Date(task.dueDate).toLocaleDateString(undefined, {
                                                                        month: "short",
                                                                        day: "numeric",
                                                                    })}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground/60">—</span>
                                                        )}
                                                    </div>

                                                    {/* Labels & Subtasks */}
                                                    <div className="col-span-2 hidden lg:flex items-center gap-2 overflow-hidden">
                                                        {task.labels && task.labels.length > 0 && (
                                                            <div className="flex items-center gap-1 overflow-hidden">
                                                                {task.labels.slice(0, 2).map((label) => (
                                                                    <span
                                                                        key={label.id}
                                                                        className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium text-white shrink-0"
                                                                        style={{ backgroundColor: label.color }}
                                                                    >
                                                                        {label.name}
                                                                    </span>
                                                                ))}
                                                                {task.labels.length > 2 && (
                                                                    <span className="text-[10px] text-muted-foreground">
                                                                        +{task.labels.length - 2}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}

                                                        {totalSubtasks > 0 && (
                                                            <div
                                                                className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0 bg-muted/60 px-1.5 py-0.5 rounded"
                                                                title={`${completedSubtasks} of ${totalSubtasks} subtasks completed`}
                                                            >
                                                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                                                <span>
                                                                    {completedSubtasks}/{totalSubtasks}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="col-span-2 sm:col-span-2 md:col-span-2 lg:col-span-1 flex items-center justify-end">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-muted-foreground opacity-60 group-hover:opacity-100 hover:text-foreground"
                                                                >
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                    <span className="sr-only">Actions</span>
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem
                                                                    onClick={() => onViewTask(task)}
                                                                    className="text-xs"
                                                                >
                                                                    <FileText className="mr-2 h-3.5 w-3.5" />
                                                                    View details
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => onEditTask(task)}
                                                                    className="text-xs"
                                                                >
                                                                    <Pencil className="mr-2 h-3.5 w-3.5" />
                                                                    Edit task
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onClick={() => onDeleteTask(task)}
                                                                    className="text-xs text-destructive focus:text-destructive"
                                                                >
                                                                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                                                                    Delete task
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Bottom Status Bar */}
            <div className="flex items-center justify-between border-t bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                    <span>
                        Total tasks: <strong className="text-foreground">{totalAllTasks}</strong>
                    </span>
                    <span>•</span>
                    <span>
                        Completed: <strong className="text-emerald-600 dark:text-emerald-400">{completedAllTasks}</strong>
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium">{completionRate}% done</span>
                    <div className="w-24">
                        <Progress value={completionRate} className="h-1.5" />
                    </div>
                </div>
            </div>
        </div>
    );
}
