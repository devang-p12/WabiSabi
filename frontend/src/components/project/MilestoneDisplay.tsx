import { useState } from "react";
import {
    CheckCircle2,
    Circle,
    Flag,
    MoreHorizontal,
    Plus,
    Trash2,
    Calendar,
    ChevronDown,
    ChevronRight,
} from "lucide-react";

import { type Milestone, deleteMilestone } from "@/api/project.api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CreateMilestoneDialog from "./CreateMilestoneDialog";

interface MilestoneDisplayProps {
    projectId: string;
    milestones: Milestone[];
    onMilestoneChanged: () => void | Promise<void>;
}

export default function MilestoneDisplay({
    projectId,
    milestones,
    onMilestoneChanged,
}: MilestoneDisplayProps) {
    const [createOpen, setCreateOpen] = useState(false);
    const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>({});

    const toggleCollapse = (milestoneId: string) => {
        setCollapsedMap((prev) => ({
            ...prev,
            [milestoneId]: !prev[milestoneId],
        }));
    };

    const handleDelete = async (milestone: Milestone) => {
        if (window.confirm(`Delete milestone "${milestone.title}"? Tasks will be retained but unlinked.`)) {
            try {
                await deleteMilestone(milestone.id);
                await onMilestoneChanged();
            } catch (err) {
                console.error("Failed to delete milestone:", err);
            }
        }
    };

    const getPriorityBadge = (priority?: string) => {
        switch (priority) {
            case "URGENT":
                return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Urgent</Badge>;
            case "HIGH":
                return <Badge variant="secondary" className="text-[10px] px-1.5 py-0 text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20">High</Badge>;
            case "MEDIUM":
                return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Medium</Badge>;
            case "LOW":
                return <Badge variant="secondary" className="text-[10px] px-1.5 py-0 text-muted-foreground">Low</Badge>;
            default:
                return null;
        }
    };

    if (milestones.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card p-12 text-center shadow-xs">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Flag className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-base">No milestones defined yet</h3>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                    Break your project down into sequential roadmap milestones or phases to track delivery targets.
                </p>
                <Button
                    onClick={() => setCreateOpen(true)}
                    className="mt-5 shadow-xs"
                >
                    <Plus className="mr-1.5 h-4 w-4" />
                    Create First Milestone
                </Button>
                <CreateMilestoneDialog
                    open={createOpen}
                    onOpenChange={setCreateOpen}
                    projectId={projectId}
                    onCreated={onMilestoneChanged}
                />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold tracking-tight">Milestone Roadmap</h3>
                    <Badge variant="secondary" className="text-xs">
                        {milestones.length}
                    </Badge>
                </div>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCreateOpen(true)}
                    className="text-xs"
                >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add Milestone
                </Button>
            </div>

            <div className="space-y-3">
                {milestones.map((milestone, index) => {
                    const tasks = milestone.tasks ?? [];
                    const completedTasks = tasks.filter((t) => t.completed).length;
                    const totalTasks = tasks.length;
                    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                    const isCollapsed = !!collapsedMap[milestone.id];

                    return (
                        <div
                            key={milestone.id}
                            className="rounded-xl border bg-card shadow-xs overflow-hidden transition-all duration-200"
                        >
                            {/* Milestone Header */}
                            <div className="flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 transition-colors">
                                <div
                                    onClick={() => toggleCollapse(milestone.id)}
                                    className="flex items-center gap-3 cursor-pointer select-none min-w-0 flex-1"
                                >
                                    <button
                                        type="button"
                                        className="text-muted-foreground hover:text-foreground"
                                    >
                                        {isCollapsed ? (
                                            <ChevronRight className="h-4 w-4" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4" />
                                        )}
                                    </button>

                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
                                        M{index + 1}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-sm truncate">
                                                {milestone.title}
                                            </h4>
                                            {progress === 100 && totalTasks > 0 && (
                                                <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-emerald-600 hover:bg-emerald-600">
                                                    Done
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                                            <span>
                                                {completedTasks} of {totalTasks} tasks completed
                                            </span>
                                            <span>•</span>
                                            <span className="font-medium text-foreground">{progress}%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Progress track in header */}
                                    <div className="hidden sm:block w-28 h-1.5 overflow-hidden rounded-full bg-muted">
                                        <div
                                            className="h-full bg-primary transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={() => handleDelete(milestone)}
                                                className="text-destructive focus:text-destructive"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete Milestone
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            {/* Milestone Tasks Body */}
                            {!isCollapsed && (
                                <div className="p-4 pt-2 border-t border-border/40">
                                    {tasks.length === 0 ? (
                                        <p className="py-3 text-xs text-muted-foreground italic text-center">
                                            No tasks assigned to this milestone yet. Assign tasks from the execution board or plan.
                                        </p>
                                    ) : (
                                        <div className="divide-y divide-border/30">
                                            {tasks.map((task) => (
                                                <div
                                                    key={task.id}
                                                    className="flex items-center justify-between py-2.5 px-2 hover:bg-muted/30 rounded-lg transition-colors"
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        {task.completed ? (
                                                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                                        ) : (
                                                            <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                                                        )}
                                                        <span
                                                            className={`text-xs font-medium truncate ${
                                                                task.completed
                                                                    ? "line-through text-muted-foreground"
                                                                    : "text-foreground"
                                                            }`}
                                                        >
                                                            {task.title}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2 shrink-0 ml-3">
                                                        {getPriorityBadge(task.priority)}
                                                        {task.dueDate && (
                                                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                                <Calendar className="h-3 w-3" />
                                                                {new Date(task.dueDate).toLocaleDateString(undefined, {
                                                                    month: "short",
                                                                    day: "numeric",
                                                                })}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <CreateMilestoneDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                projectId={projectId}
                onCreated={onMilestoneChanged}
            />
        </div>
    );
}
