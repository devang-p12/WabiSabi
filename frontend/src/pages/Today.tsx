import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Clock,
    Hourglass,
    Loader2,
    RefreshCw,
    Sparkles,
    Lock,
    ListFilter,
    ChevronDown,
    ChevronUp,
} from "lucide-react";

import {
    getTodayPlan,
    type PlannedTaskItem,
    type TodayPlanResult,
} from "@/api/planner.api";
import { getTask, updateTask, type Task } from "@/api/task.api";
import { getWorkspace, type Workspace } from "@/api/workspace.api";
import { getWorkspaceProjects, type Project } from "@/api/project.api";

import { Button } from "@/components/ui/button";
import PlannerTaskCard from "@/components/planner/PlannerTaskCard";
import TaskDetailsDialog from "@/components/board/TaskDetailsDialog";
import NotificationBell from "@/components/notifications/NotificationBell";
import CommandTriggerButton from "@/components/command/CommandTriggerButton";

const AVAILABILITY_PRESETS = [
    { label: "2 hrs", minutes: 120 },
    { label: "4 hrs", minutes: 240 },
    { label: "6 hrs", minutes: 360 },
    { label: "8 hrs", minutes: 480 },
];

export default function Today() {
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const navigate = useNavigate();

    const [workspace, setWorkspace] = useState<Workspace | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");
    const [availableMinutes, setAvailableMinutes] = useState<number>(480);
    const [plan, setPlan] = useState<TodayPlanResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Collapsible sections
    const [showBlocked, setShowBlocked] = useState(true);
    const [showOverflow, setShowOverflow] = useState(false);
    const [showCompleted, setShowCompleted] = useState(false);

    // Task Details Modal
    const [dialogTask, setDialogTask] = useState<Task | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const loadPlan = useCallback(
        async (isRefresh = false) => {
            try {
                if (isRefresh) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }
                setError(null);

                const planData = await getTodayPlan({
                    workspaceId,
                    availableMinutes,
                    projectId: selectedProjectId !== "ALL" ? selectedProjectId : undefined,
                });
                setPlan(planData);
            } catch (err: any) {
                console.error("Failed to load today plan:", err);
                setError(
                    err.response?.data?.message ||
                        "Unable to load today's plan. Please try again."
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [workspaceId, availableMinutes, selectedProjectId]
    );

    // Initial load & workspace fetch
    useEffect(() => {
        if (workspaceId) {
            getWorkspace(workspaceId)
                .then(setWorkspace)
                .catch(() => {});
            getWorkspaceProjects(workspaceId)
                .then(setProjects)
                .catch(() => {});
        }
    }, [workspaceId]);

    useEffect(() => {
        loadPlan();
    }, [loadPlan]);

    // Task Interactions
    const handleToggleComplete = async (item: PlannedTaskItem) => {
        try {
            await updateTask(item.id, {
                completed: !item.completed,
            });
            await loadPlan(true);
        } catch (err) {
            console.error("Failed to toggle task completion:", err);
        }
    };

    const handleStartTask = async (item: PlannedTaskItem) => {
        try {
            await updateTask(item.id, {
                startedAt: new Date().toISOString(),
            });
            await loadPlan(true);
        } catch (err) {
            console.error("Failed to start task:", err);
        }
    };

    const handleViewDetails = async (item: PlannedTaskItem) => {
        try {
            const fullTask = await getTask(item.id);
            setDialogTask(fullTask);
            setDialogOpen(true);
        } catch (err) {
            console.error("Failed to fetch full task details:", err);
        }
    };

    const todayFormattedDate = new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    });

    const hasAnyPlanned =
        plan &&
        (plan.sections.next ||
            plan.sections.upNext.length > 0 ||
            plan.sections.later.length > 0);

    return (
        <div className="flex h-screen flex-col bg-background text-foreground">
            {/* Top Navigation Bar */}
            <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 sm:px-6 bg-card/60 backdrop-blur-xs">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                            navigate(
                                workspaceId ? `/workspaces/${workspaceId}` : "/dashboard"
                            )
                        }
                        className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Back to workspace"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm sm:text-base">
                            {workspace?.name || "Workspace"}
                        </span>
                        <span className="text-muted-foreground">/</span>
                        <div className="flex items-center gap-1.5 font-bold text-sm sm:text-base text-primary">
                            <Calendar className="h-4 w-4" />
                            Today
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <CommandTriggerButton />
                    <NotificationBell />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadPlan(true)}
                        disabled={refreshing || loading}
                        className="h-8 px-2.5 text-xs gap-1.5 cursor-pointer"
                    >
                        <RefreshCw
                            className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
                        />
                        <span className="hidden sm:inline">Refresh</span>
                    </Button>
                </div>
            </header>

            {/* Main Content Scroll Area */}
            <main className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8 space-y-8">
                    {/* Hero Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b">
                        <div>
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                                <Clock className="h-3.5 w-3.5" />
                                Daily Plan & Focus
                            </div>

                            <div className="flex items-baseline gap-3 flex-wrap">
                                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                    TODAY
                                </h1>

                                {plan && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-primary/15 text-primary border border-primary/25 shadow-2xs">
                                        {plan.plannedTimeFormatted}
                                    </span>
                                )}
                            </div>

                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                {todayFormattedDate}
                            </p>
                        </div>

                        {/* Availability and Project Controls */}
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Project Filter */}
                            {projects.length > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <ListFilter className="h-3.5 w-3.5 text-muted-foreground" />
                                    <select
                                        value={selectedProjectId}
                                        onChange={(e) => setSelectedProjectId(e.target.value)}
                                        className="h-8 rounded-md border border-input bg-background px-2.5 text-xs font-medium focus:ring-1 focus:ring-primary"
                                    >
                                        <option value="ALL">All Projects</option>
                                        {projects.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Availability chips */}
                            <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-1">
                                <span className="text-[11px] font-medium text-muted-foreground px-2 flex items-center gap-1">
                                    <Hourglass className="h-3 w-3" />
                                    Available:
                                </span>
                                {AVAILABILITY_PRESETS.map((preset) => (
                                    <button
                                        key={preset.minutes}
                                        type="button"
                                        onClick={() => setAvailableMinutes(preset.minutes)}
                                        className={`rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                                            availableMinutes === preset.minutes
                                                ? "bg-primary text-primary-foreground shadow-2xs"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm">Calculating today's deterministic plan…</p>
                        </div>
                    )}

                    {/* Error State */}
                    {!loading && error && (
                        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm flex items-center justify-between">
                            <span>{error}</span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => loadPlan()}
                                className="h-7 text-xs"
                            >
                                Try again
                            </Button>
                        </div>
                    )}

                    {/* Main Planner Sections */}
                    {!loading && !error && plan && (
                        <div className="space-y-8">
                            {/* Empty state */}
                            {!hasAnyPlanned &&
                                plan.sections.blocked.length === 0 &&
                                plan.sections.completedToday.length === 0 && (
                                    <div className="py-16 text-center border-2 border-dashed rounded-xl bg-card/40 p-8 space-y-3">
                                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-1">
                                            <Sparkles className="h-6 w-6" />
                                        </div>
                                        <h3 className="text-lg font-bold">You are all caught up!</h3>
                                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                            No incomplete tasks scheduled for today. Enjoy your day or add new tasks in your board.
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                navigate(
                                                    workspaceId
                                                        ? `/workspaces/${workspaceId}`
                                                        : "/dashboard"
                                                )
                                            }
                                            className="cursor-pointer"
                                        >
                                            Go to Board
                                        </Button>
                                    </div>
                                )}

                            {/* 1. NEXT (Single Top Priority Task) */}
                            {plan.sections.next && (
                                <section className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                                            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                            NEXT
                                        </h2>
                                        <span className="text-xs text-muted-foreground">
                                            Focus on this first
                                        </span>
                                    </div>

                                    <PlannerTaskCard
                                        task={plan.sections.next}
                                        variant="hero"
                                        onToggleComplete={handleToggleComplete}
                                        onStartTask={handleStartTask}
                                        onViewDetails={handleViewDetails}
                                    />
                                </section>
                            )}

                            {/* 2. UP NEXT (Next 1-2 tasks) */}
                            {plan.sections.upNext.length > 0 && (
                                <section className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                            UP NEXT ({plan.sections.upNext.length})
                                        </h2>
                                        <span className="text-xs text-muted-foreground">
                                            Immediately after
                                        </span>
                                    </div>

                                    <div className="grid gap-3">
                                        {plan.sections.upNext.map((task) => (
                                            <PlannerTaskCard
                                                key={task.id}
                                                task={task}
                                                variant="standard"
                                                onToggleComplete={handleToggleComplete}
                                                onStartTask={handleStartTask}
                                                onViewDetails={handleViewDetails}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* 3. LATER (Remaining tasks scheduled for today) */}
                            {plan.sections.later.length > 0 && (
                                <section className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                            LATER ({plan.sections.later.length})
                                        </h2>
                                        <span className="text-xs text-muted-foreground">
                                            Scheduled for later today
                                        </span>
                                    </div>

                                    <div className="grid gap-2.5">
                                        {plan.sections.later.map((task) => (
                                            <PlannerTaskCard
                                                key={task.id}
                                                task={task}
                                                variant="standard"
                                                onToggleComplete={handleToggleComplete}
                                                onStartTask={handleStartTask}
                                                onViewDetails={handleViewDetails}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* 4. BLOCKED SECTION (Tasks waiting on dependencies) */}
                            {plan.sections.blocked.length > 0 && (
                                <section className="space-y-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowBlocked((prev) => !prev)}
                                        className="flex items-center justify-between w-full text-left text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 cursor-pointer"
                                    >
                                        <span className="flex items-center gap-1.5">
                                            <Lock className="h-3.5 w-3.5" />
                                            BLOCKED ({plan.sections.blocked.length})
                                        </span>
                                        <span className="flex items-center gap-1 text-[11px] font-normal text-muted-foreground">
                                            Waiting on prerequisites
                                            {showBlocked ? (
                                                <ChevronUp className="h-3.5 w-3.5" />
                                            ) : (
                                                <ChevronDown className="h-3.5 w-3.5" />
                                            )}
                                        </span>
                                    </button>

                                    {showBlocked && (
                                        <div className="grid gap-2.5">
                                            {plan.sections.blocked.map((task) => (
                                                <PlannerTaskCard
                                                    key={task.id}
                                                    task={task}
                                                    variant="blocked"
                                                    onToggleComplete={handleToggleComplete}
                                                    onViewDetails={handleViewDetails}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </section>
                            )}

                            {/* 5. COMPLETED TODAY */}
                            {plan.sections.completedToday.length > 0 && (
                                <section className="space-y-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowCompleted((prev) => !prev)}
                                        className="flex items-center justify-between w-full text-left text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 cursor-pointer"
                                    >
                                        <span className="flex items-center gap-1.5">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            COMPLETED TODAY ({plan.sections.completedToday.length})
                                        </span>
                                        <span className="flex items-center gap-1 text-[11px] font-normal text-muted-foreground">
                                            {plan.completedTimeFormatted} accomplished
                                            {showCompleted ? (
                                                <ChevronUp className="h-3.5 w-3.5" />
                                            ) : (
                                                <ChevronDown className="h-3.5 w-3.5" />
                                            )}
                                        </span>
                                    </button>

                                    {showCompleted && (
                                        <div className="grid gap-2">
                                            {plan.sections.completedToday.map((task) => (
                                                <PlannerTaskCard
                                                    key={task.id}
                                                    task={task}
                                                    variant="completed"
                                                    onToggleComplete={handleToggleComplete}
                                                    onViewDetails={handleViewDetails}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </section>
                            )}

                            {/* 6. OVERFLOW / BACKLOG (Exceeds daily availability budget) */}
                            {plan.sections.overflow.length > 0 && (
                                <section className="space-y-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowOverflow((prev) => !prev)}
                                        className="flex items-center justify-between w-full text-left text-xs font-bold uppercase tracking-wider text-muted-foreground cursor-pointer"
                                    >
                                        <span className="flex items-center gap-1.5">
                                            <Hourglass className="h-3.5 w-3.5" />
                                            BACKLOG / OVERFLOW ({plan.sections.overflow.length})
                                        </span>
                                        <span className="flex items-center gap-1 text-[11px] font-normal">
                                            Exceeds today's {plan.availableTimeFormatted} budget
                                            {showOverflow ? (
                                                <ChevronUp className="h-3.5 w-3.5" />
                                            ) : (
                                                <ChevronDown className="h-3.5 w-3.5" />
                                            )}
                                        </span>
                                    </button>

                                    {showOverflow && (
                                        <div className="grid gap-2.5 opacity-80">
                                            {plan.sections.overflow.map((task) => (
                                                <PlannerTaskCard
                                                    key={task.id}
                                                    task={task}
                                                    variant="standard"
                                                    onToggleComplete={handleToggleComplete}
                                                    onStartTask={handleStartTask}
                                                    onViewDetails={handleViewDetails}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </section>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Task Details Modal Dialog */}
            {dialogTask && (
                <TaskDetailsDialog
                    task={dialogTask}
                    boardId={dialogTask.list?.id || ""}
                    open={dialogOpen}
                    onOpenChange={(open) => {
                        setDialogOpen(open);
                        if (!open) {
                            setDialogTask(null);
                            loadPlan(true);
                        }
                    }}
                    onEdit={() => {}}
                    onDelete={() => {
                        setDialogOpen(false);
                        loadPlan(true);
                    }}
                    onLabelsChange={() => {}}
                    onTaskUpdate={(updated) => {
                        setDialogTask(updated);
                        loadPlan(true);
                    }}
                />
            )}
        </div>
    );
}
