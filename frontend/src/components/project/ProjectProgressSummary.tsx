import {
    CheckCircle2,
    Clock,
    Flag,
    ListTodo,
} from "lucide-react";

import type { Project } from "@/api/project.api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProjectProgressSummaryProps {
    project: Project;
}

export default function ProjectProgressSummary({ project }: ProjectProgressSummaryProps) {
    const totalTasks = project.totalTasks ?? project.tasks?.length ?? 0;
    const completedTasks = project.completedTasks ?? 0;
    const remainingTasks = Math.max(0, totalTasks - completedTasks);
    const progress = project.progressPercentage ?? (totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0);

    const totalMilestones = project.milestones?.length ?? 0;
    const completedMilestones = project.milestones?.filter((m) => {
        const milestoneTasks = m.tasks ?? [];
        return milestoneTasks.length > 0 && milestoneTasks.every((t) => t.completed);
    }).length ?? 0;

    let statusText = "Not Started";
    let statusVariant: "secondary" | "default" | "outline" = "secondary";
    if (progress === 100 && totalTasks > 0) {
        statusText = "Completed";
        statusVariant = "default";
    } else if (progress > 0) {
        statusText = "In Progress";
        statusVariant = "outline";
    }

    return (
        <div className="space-y-4">
            {/* Main Progress Bar Strip */}
            <div className="rounded-2xl border bg-card p-5 sm:p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold tracking-tight">Project Execution Progress</h3>
                            <Badge variant={statusVariant} className="text-xs">
                                {statusText}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {completedTasks} of {totalTasks} total tasks completed across {totalMilestones} roadmap milestones.
                        </p>
                    </div>

                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold tracking-tight text-primary">
                            {progress}%
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">completed</span>
                    </div>
                </div>

                <div className="mt-4">
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                            className="h-full bg-primary transition-all duration-500 rounded-full"
                            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Metric Cards Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-xs hover:border-primary/40 transition-colors">
                    <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Total Tasks</p>
                            <h4 className="text-2xl font-bold mt-1">{totalTasks}</h4>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Assigned to project</p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <ListTodo className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-xs hover:border-primary/40 transition-colors">
                    <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Completed</p>
                            <h4 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                                {completedTasks}
                            </h4>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Tasks delivered</p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-xs hover:border-primary/40 transition-colors">
                    <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Pending Tasks</p>
                            <h4 className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">
                                {remainingTasks}
                            </h4>
                            <p className="text-[11px] text-muted-foreground mt-0.5">In queue or progress</p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <Clock className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-xs hover:border-primary/40 transition-colors">
                    <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Milestones</p>
                            <h4 className="text-2xl font-bold mt-1">{totalMilestones}</h4>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                {completedMilestones} of {totalMilestones} completed
                            </p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Flag className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
