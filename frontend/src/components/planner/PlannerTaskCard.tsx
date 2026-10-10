import {
    CheckCircle2,
    Circle,
    Clock,
    Play,
    AlertTriangle,
    FolderKanban,
    Calendar,
    ChevronRight,
    Lock,
} from "lucide-react";
import type { PlannedTaskItem } from "@/api/planner.api";
import type { TaskPriority } from "@/api/task.api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PlannerTaskCardProps {
    task: PlannedTaskItem;
    variant?: "hero" | "standard" | "blocked" | "completed";
    onToggleComplete: (task: PlannedTaskItem) => void;
    onStartTask?: (task: PlannedTaskItem) => void;
    onViewDetails: (task: PlannedTaskItem) => void;
    disabled?: boolean;
}

const priorityConfig: Record<
    TaskPriority,
    { label: string; className: string; dot: string }
> = {
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

export default function PlannerTaskCard({
    task,
    variant = "standard",
    onToggleComplete,
    onStartTask,
    onViewDetails,
    disabled = false,
}: PlannerTaskCardProps) {
    const priority = priorityConfig[task.priority] || priorityConfig.MEDIUM;

    const formattedMinutes = (mins: number) => {
        if (mins < 60) return `${mins} min`;
        const hrs = Math.floor(mins / 60);
        const rem = mins % 60;
        return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
    };

    const formattedDue = task.dueDate
        ? new Date(task.dueDate).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
          })
        : null;

    const isOverdue = task.dueDate && new Date(task.dueDate).getTime() < Date.now();

    // 1. HERO VARIANT (Top NEXT task)
    if (variant === "hero") {
        return (
            <div
                onClick={() => onViewDetails(task)}
                className={cn(
                    "group relative overflow-hidden rounded-xl border-2 border-primary/40 bg-gradient-to-br from-card via-card to-primary/5 p-5 sm:p-6 shadow-md transition-all hover:border-primary hover:shadow-lg cursor-pointer",
                    task.completed && "opacity-75"
                )}
            >
                {/* Accent Top Ribbon */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary/60" />

                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        {/* Completion Button */}
                        <button
                            type="button"
                            disabled={disabled}
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleComplete(task);
                            }}
                            className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                            title={task.completed ? "Mark incomplete" : "Complete task"}
                        >
                            {task.completed ? (
                                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                                <Circle className="h-6 w-6 hover:text-primary" />
                            )}
                        </button>

                        <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase bg-primary/10 text-primary border border-primary/20">
                                    Current Focus
                                </span>

                                <span
                                    className={cn(
                                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                                        priority.className
                                    )}
                                >
                                    <span className={cn("h-1.5 w-1.5 rounded-full", priority.dot)} />
                                    {priority.label}
                                </span>

                                {task.projectName && (
                                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                        <FolderKanban className="h-3 w-3" />
                                        {task.projectName}
                                    </span>
                                )}
                            </div>

                            <h3
                                className={cn(
                                    "text-lg sm:text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors",
                                    task.completed && "line-through text-muted-foreground"
                                )}
                            >
                                {task.title}
                            </h3>

                            {task.primaryReason && (
                                <p className="text-xs font-medium text-primary/80">
                                    Why now: {task.primaryReason}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Time Badge & Start Action */}
                    <div className="flex flex-col items-end gap-2.5 shrink-0">
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 text-primary font-bold text-sm">
                            <Clock className="h-4 w-4" />
                            {formattedMinutes(task.effectiveMinutes)}
                        </div>

                        {!task.completed && (
                            <div className="flex items-center gap-2">
                                {task.startedAt ? (
                                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                        <Play className="h-3 w-3 fill-current" />
                                        In Progress
                                    </span>
                                ) : onStartTask ? (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onStartTask(task);
                                        }}
                                        className="h-7 text-xs gap-1 border-primary/30 hover:bg-primary/10 cursor-pointer"
                                    >
                                        <Play className="h-3 w-3" />
                                        Start
                                    </Button>
                                ) : null}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer details */}
                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                        {formattedDue && (
                            <span
                                className={cn(
                                    "flex items-center gap-1",
                                    isOverdue ? "text-destructive font-medium" : ""
                                )}
                            >
                                <Calendar className="h-3 w-3" />
                                {isOverdue ? "Overdue: " : "Due: "}
                                {formattedDue}
                            </span>
                        )}

                        {task.boardName && (
                            <span>Board: {task.boardName}</span>
                        )}
                    </div>

                    <span className="flex items-center gap-1 text-primary group-hover:translate-x-0.5 transition-transform">
                        Details <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                </div>
            </div>
        );
    }

    // 2. BLOCKED VARIANT
    if (variant === "blocked") {
        return (
            <div
                onClick={() => onViewDetails(task)}
                className="group relative overflow-hidden rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 transition-all hover:border-amber-500/60 cursor-pointer"
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400">
                            <Lock className="h-4 w-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30">
                                    Blocked
                                </Badge>
                                <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.2 text-[10px] font-medium", priority.className)}>
                                    {priority.label}
                                </span>
                            </div>

                            <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                {task.title}
                            </h4>

                            {task.blockingDependencies.length > 0 && (
                                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3 shrink-0" />
                                    Prerequisite: {task.blockingDependencies.map((b) => b.title).join(", ")}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <Clock className="h-3 w-3" />
                        {formattedMinutes(task.effectiveMinutes)}
                    </div>
                </div>
            </div>
        );
    }

    // 3. COMPLETED VARIANT
    if (variant === "completed") {
        return (
            <div
                onClick={() => onViewDetails(task)}
                className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 text-muted-foreground hover:bg-muted/30 transition-colors cursor-pointer"
            >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleComplete(task);
                        }}
                        className="text-emerald-600 dark:text-emerald-400 hover:opacity-80 shrink-0 cursor-pointer"
                    >
                        <CheckCircle2 className="h-4 w-4" />
                    </button>
                    <span className="text-sm line-through truncate">
                        {task.title}
                    </span>
                </div>
                <div className="text-xs text-muted-foreground shrink-0 pl-2">
                    {formattedMinutes(task.actualMinutes || task.effectiveMinutes)}
                </div>
            </div>
        );
    }

    // 4. STANDARD VARIANT (Up Next & Later)
    return (
        <div
            onClick={() => onViewDetails(task)}
            className="group relative overflow-hidden rounded-lg border bg-card p-3.5 sm:p-4 shadow-xs transition-all hover:border-primary/50 hover:shadow-sm cursor-pointer"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleComplete(task);
                        }}
                        className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                        title="Complete task"
                    >
                        {task.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                            <Circle className="h-5 w-5 hover:text-primary" />
                        )}
                    </button>

                    <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span
                                className={cn(
                                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                                    priority.className
                                )}
                            >
                                <span className={cn("h-1 w-1 rounded-full", priority.dot)} />
                                {priority.label}
                            </span>

                            {task.projectName && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground truncate max-w-[160px]">
                                    <FolderKanban className="h-3 w-3 shrink-0" />
                                    {task.projectName}
                                </span>
                            )}
                        </div>

                        <h4 className="text-sm sm:text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                            {task.title}
                        </h4>

                        {task.primaryReason && (
                            <p className="text-[11px] text-muted-foreground">
                                {task.primaryReason}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-xs font-semibold text-foreground">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {formattedMinutes(task.effectiveMinutes)}
                    </div>

                    {!task.completed && onStartTask && !task.startedAt && (
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                                e.stopPropagation();
                                onStartTask(task);
                            }}
                            className="h-6 px-2 text-[11px] gap-1 text-muted-foreground hover:text-primary cursor-pointer"
                        >
                            <Play className="h-2.5 w-2.5" />
                            Start
                        </Button>
                    )}

                    {task.startedAt && !task.completed && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                            Started
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
