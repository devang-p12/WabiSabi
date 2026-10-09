import { useEffect, useState, useMemo } from "react";
import {
    BarChart3,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Flame,
    Users,
    RefreshCw,
    Sparkles,
    CheckSquare,
    Layers,
    TrendingUp,
} from "lucide-react";
import {
    getWorkspaceAnalytics,
    type WorkspaceAnalyticsData,
} from "@/api/analytics.api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { resolveAssetUrl } from "@/api/attachment.api";

interface WorkspaceAnalyticsDashboardProps {
    workspaceId: string;
    boards?: Array<{ id: string; name: string }>;
    initialBoardId?: string | null;
    isBoardView?: boolean;
}

const PRIORITY_THEMES = {
    URGENT: {
        label: "Urgent",
        barColor: "bg-red-500",
        textColor: "text-red-600 dark:text-red-400",
        bgLight: "bg-red-500/10",
        border: "border-red-500/20",
    },
    HIGH: {
        label: "High",
        barColor: "bg-orange-500",
        textColor: "text-orange-600 dark:text-orange-400",
        bgLight: "bg-orange-500/10",
        border: "border-orange-500/20",
    },
    MEDIUM: {
        label: "Medium",
        barColor: "bg-blue-500",
        textColor: "text-blue-600 dark:text-blue-400",
        bgLight: "bg-blue-500/10",
        border: "border-blue-500/20",
    },
    LOW: {
        label: "Low",
        barColor: "bg-slate-400",
        textColor: "text-slate-600 dark:text-slate-400",
        bgLight: "bg-slate-500/10",
        border: "border-slate-500/20",
    },
};

const WORKLOAD_BADGES = {
    Available: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    Optimal: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    Moderate: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    Heavy: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

export default function WorkspaceAnalyticsDashboard({
    workspaceId,
    boards = [],
    initialBoardId = null,
    isBoardView = false,
}: WorkspaceAnalyticsDashboardProps) {
    const [selectedBoardId, setSelectedBoardId] = useState<string | null>(initialBoardId);
    const [timeframe, setTimeframe] = useState<"7d" | "14d" | "30d">("7d");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<WorkspaceAnalyticsData | null>(null);
    const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null);

    const loadAnalytics = async (isManualRefresh = false) => {
        try {
            if (isManualRefresh) setRefreshing(true);
            else setLoading(true);

            const result = await getWorkspaceAnalytics(workspaceId, {
                boardId: selectedBoardId || undefined,
                timeframe,
            });
            setData(result);
        } catch (error) {
            console.error("Failed to load analytics:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadAnalytics();
    }, [workspaceId, selectedBoardId, timeframe]);

    // Calculate maximum bar height for trend chart scaling
    const maxDailyVolume = useMemo(() => {
        if (!data?.dailyTrends || data.dailyTrends.length === 0) return 5;
        const maxVal = Math.max(
            ...data.dailyTrends.map((d) => Math.max(d.created, d.completed)),
            3
        );
        return maxVal;
    }, [data?.dailyTrends]);

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="relative flex h-12 w-12 items-center justify-center">
                    <div className="absolute h-12 w-12 animate-ping rounded-full bg-primary/20" />
                    <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                </div>
                <p className="text-sm text-muted-foreground animate-pulse">
                    Crunching workspace metrics & insights…
                </p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                Unable to load analytics data.
            </div>
        );
    }

    const { overview, priorityBreakdown, stagesBreakdown, workloadDistribution, dailyTrends, recentCompletions } = data;

    // Circumference calculation for circular SVG progress ring
    const radius = 34;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (overview.completionRate / 100) * circumference;

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-16">
            {/* Header with Scope & Timeframe Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
                            <BarChart3 className="h-5 w-5" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                            Analytics & Insights
                        </h2>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {selectedBoardId
                            ? `Performance metrics for ${data.filter.boardName || "Board"}`
                            : `Workspace-wide performance across ${boards.length || 1} boards`}
                    </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Board Selector (if not locked in board view and multiple boards exist) */}
                    {!isBoardView && boards.length > 0 && (
                        <select
                            value={selectedBoardId || ""}
                            onChange={(e) => setSelectedBoardId(e.target.value || null)}
                            className="h-8 rounded-lg border border-input bg-background px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring shadow-2xs"
                        >
                            <option value="">All Boards ({boards.length})</option>
                            {boards.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                    )}

                    {/* Timeframe Pill Switcher */}
                    <div className="inline-flex rounded-lg border bg-muted/30 p-0.5 text-xs">
                        {(["7d", "14d", "30d"] as const).map((tf) => (
                            <button
                                key={tf}
                                type="button"
                                onClick={() => setTimeframe(tf)}
                                className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                                    timeframe === tf
                                        ? "bg-background text-foreground shadow-xs"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {tf === "7d" ? "7 Days" : tf === "14d" ? "14 Days" : "30 Days"}
                            </button>
                        ))}
                    </div>

                    {/* Refresh Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadAnalytics(true)}
                        disabled={refreshing}
                        className="h-8 px-2.5 text-xs shadow-2xs cursor-pointer"
                        title="Refresh metrics"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Top 4 Key Performance Indicators (KPI Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Completion Rate & Total Tasks */}
                <div className="relative overflow-hidden rounded-2xl border bg-card/60 backdrop-blur-xs p-5 shadow-xs hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                        <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Completion Rate
                            </span>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-3xl font-extrabold tracking-tight">
                                    {overview.completionRate}%
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                <span className="font-semibold text-foreground">
                                    {overview.completedTasks}
                                </span>{" "}
                                of {overview.totalTasks} tasks done
                            </p>
                        </div>

                        {/* Circular Progress Ring */}
                        <div className="relative flex items-center justify-center">
                            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
                                <circle
                                    cx="40"
                                    cy="40"
                                    r={radius}
                                    stroke="currentColor"
                                    strokeWidth="6"
                                    fill="transparent"
                                    className="text-muted/40"
                                />
                                <circle
                                    cx="40"
                                    cy="40"
                                    r={radius}
                                    stroke="currentColor"
                                    strokeWidth="6"
                                    fill="transparent"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                    className="text-emerald-500 transition-all duration-700 ease-out"
                                />
                            </svg>
                            <CheckCircle2 className="absolute h-6 w-6 text-emerald-500" />
                        </div>
                    </div>
                </div>

                {/* 2. In-Progress Velocity */}
                <div className="relative overflow-hidden rounded-2xl border bg-card/60 backdrop-blur-xs p-5 shadow-xs hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Active In-Progress
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                            <Flame className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-3xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400">
                            {overview.inProgressTasks}
                        </span>
                        <span className="text-xs text-muted-foreground">in active development</span>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                        <span>Queued (To Do)</span>
                        <span className="font-semibold text-foreground">{overview.todoTasks} tasks</span>
                    </div>
                </div>

                {/* 3. Deadline Health (Overdue / Due Soon) */}
                <div className="relative overflow-hidden rounded-2xl border bg-card/60 backdrop-blur-xs p-5 shadow-xs hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Schedule Health
                        </span>
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                            overview.overdueTasks > 0
                                ? "bg-red-500/10 text-red-500"
                                : "bg-emerald-500/10 text-emerald-500"
                        }`}>
                            {overview.overdueTasks > 0 ? (
                                <AlertTriangle className="h-4 w-4" />
                            ) : (
                                <Clock className="h-4 w-4" />
                            )}
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2 mt-2">
                        <span className={`text-3xl font-extrabold tracking-tight ${
                            overview.overdueTasks > 0
                                ? "text-red-600 dark:text-red-400"
                                : "text-emerald-600 dark:text-emerald-400"
                        }`}>
                            {overview.overdueTasks}
                        </span>
                        <span className="text-xs text-muted-foreground">overdue</span>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                        <span>Due in next 48h</span>
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                            {overview.dueSoonTasks} tasks
                        </span>
                    </div>
                </div>

                {/* 4. Subtasks / Checklist Velocity */}
                <div className="relative overflow-hidden rounded-2xl border bg-card/60 backdrop-blur-xs p-5 shadow-xs hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Checklists Progress
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <CheckSquare className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-3xl font-extrabold tracking-tight">
                            {overview.subtaskCompletionRate}%
                        </span>
                        <span className="text-xs text-muted-foreground">subtasks cleared</span>
                    </div>
                    <div className="mt-3">
                        <Progress value={overview.subtaskCompletionRate} className="h-1.5" />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Cleared</span>
                        <span className="font-semibold text-foreground">
                            {overview.completedSubtasks} / {overview.totalSubtasks}
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Interactive Charts & Breakdowns (2-Column Grid) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left (2 Columns wide): Velocity Chart + Stages Pipeline */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Velocity / Activity Daily Trend Chart */}
                    <div className="rounded-2xl border bg-card/60 backdrop-blur-xs p-5 sm:p-6 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                            <div>
                                <h3 className="font-semibold text-base flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                    Activity & Velocity Trend
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Tasks created vs. tasks completed across the last {timeframe}
                                </p>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                                    <span>Created</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                    <span>Completed</span>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Bar Chart Visualization */}
                        <div className="pt-4 pb-2">
                            <div className="h-48 flex items-end justify-between gap-1 sm:gap-2 px-2 border-b">
                                {dailyTrends.map((trend, idx) => {
                                    const createdHeight = Math.round((trend.created / maxDailyVolume) * 100);
                                    const completedHeight = Math.round((trend.completed / maxDailyVolume) * 100);
                                    const isHovered = hoveredTrendIndex === idx;

                                    return (
                                        <div
                                            key={trend.date}
                                            className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                                            onMouseEnter={() => setHoveredTrendIndex(idx)}
                                            onMouseLeave={() => setHoveredTrendIndex(null)}
                                        >
                                            {/* Tooltip on Hover */}
                                            {isHovered && (
                                                <div className="absolute -top-14 z-30 bg-popover text-popover-foreground border shadow-lg rounded-lg px-2.5 py-1.5 text-[11px] whitespace-nowrap animate-in fade-in-50 zoom-in-95 pointer-events-none">
                                                    <div className="font-semibold">{trend.date} ({trend.dayLabel})</div>
                                                    <div className="text-blue-500">Created: {trend.created}</div>
                                                    <div className="text-emerald-500">Completed: {trend.completed}</div>
                                                </div>
                                            )}

                                            {/* Dual Bars */}
                                            <div className="w-full max-w-[28px] flex items-end justify-center gap-0.5 sm:gap-1 h-full pb-1">
                                                {/* Created bar */}
                                                <div
                                                    style={{ height: `${Math.max(createdHeight, 4)}%` }}
                                                    className={`w-1/2 rounded-t-sm transition-all duration-300 ${
                                                        trend.created > 0
                                                            ? "bg-blue-500 group-hover:bg-blue-400"
                                                            : "bg-muted/40"
                                                    }`}
                                                />
                                                {/* Completed bar */}
                                                <div
                                                    style={{ height: `${Math.max(completedHeight, 4)}%` }}
                                                    className={`w-1/2 rounded-t-sm transition-all duration-300 ${
                                                        trend.completed > 0
                                                            ? "bg-emerald-500 group-hover:bg-emerald-400"
                                                            : "bg-muted/40"
                                                    }`}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* X-Axis Day Labels */}
                            <div className="flex items-center justify-between gap-1 sm:gap-2 px-2 pt-2 text-[11px] text-muted-foreground">
                                {dailyTrends.map((trend) => (
                                    <div key={trend.date} className="flex-1 text-center truncate">
                                        {trend.dayLabel}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Workflow Stages / List Funnel */}
                    <div className="rounded-2xl border bg-card/60 backdrop-blur-xs p-5 sm:p-6 shadow-xs">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-semibold text-base flex items-center gap-2">
                                    <Layers className="h-4 w-4 text-primary" />
                                    Workflow Pipeline & Stages
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Task distribution across board lists
                                </p>
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {stagesBreakdown.length} active columns
                            </span>
                        </div>

                        {stagesBreakdown.length === 0 ? (
                            <p className="text-xs italic text-muted-foreground py-4 text-center">
                                No board lists found.
                            </p>
                        ) : (
                            <div className="space-y-3.5 pt-1">
                                {stagesBreakdown.map((stage) => (
                                    <div key={stage.listId} className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-medium truncate max-w-[200px]">
                                                {stage.listName}
                                            </span>
                                            <span className="text-muted-foreground">
                                                <span className="font-semibold text-foreground">
                                                    {stage.taskCount}
                                                </span>{" "}
                                                tasks ({stage.percentage}%)
                                            </span>
                                        </div>
                                        <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
                                            <div
                                                style={{ width: `${stage.percentage}%` }}
                                                className="h-full bg-primary/80 rounded-full transition-all duration-500"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Priority Breakdown & Team Workload */}
                <div className="space-y-6">
                    {/* Priority Breakdown Card */}
                    <div className="rounded-2xl border bg-card/60 backdrop-blur-xs p-5 sm:p-6 shadow-xs">
                        <h3 className="font-semibold text-base flex items-center gap-2 mb-1">
                            <Sparkles className="h-4 w-4 text-primary" />
                            Priority Breakdown
                        </h3>
                        <p className="text-xs text-muted-foreground mb-4">
                            Task urgency and focus distribution
                        </p>

                        {/* Segmented Bar */}
                        <div className="h-3 w-full bg-muted/30 rounded-full overflow-hidden flex gap-0.5 p-0.5 mb-4">
                            {(["URGENT", "HIGH", "MEDIUM", "LOW"] as const).map((key) => {
                                const pri = priorityBreakdown[key];
                                if (!pri || pri.percentage === 0) return null;
                                return (
                                    <div
                                        key={key}
                                        style={{ width: `${pri.percentage}%` }}
                                        className={`h-full rounded-sm ${PRIORITY_THEMES[key].barColor} transition-all duration-500`}
                                        title={`${PRIORITY_THEMES[key].label}: ${pri.count} (${pri.percentage}%)`}
                                    />
                                );
                            })}
                        </div>

                        {/* Priority Rows */}
                        <div className="space-y-2.5">
                            {(["URGENT", "HIGH", "MEDIUM", "LOW"] as const).map((key) => {
                                const theme = PRIORITY_THEMES[key];
                                const pri = priorityBreakdown[key];
                                return (
                                    <div
                                        key={key}
                                        className="flex items-center justify-between p-2 rounded-xl bg-muted/20 border border-transparent hover:border-border/60 transition-colors text-xs"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className={`h-2 w-2 rounded-full ${theme.barColor}`} />
                                            <span className="font-medium">{theme.label}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-foreground">
                                                {pri.count}
                                            </span>
                                            <span className="text-muted-foreground w-10 text-right">
                                                {pri.percentage}%
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Team Workload & Member Capacity */}
                    <div className="rounded-2xl border bg-card/60 backdrop-blur-xs p-5 sm:p-6 shadow-xs">
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-base flex items-center gap-2">
                                <Users className="h-4 w-4 text-primary" />
                                Team Workload
                            </h3>
                            <span className="text-xs text-muted-foreground">
                                {workloadDistribution.length} members
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">
                            Assigned tasks and member capacity
                        </p>

                        <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                            {workloadDistribution.map((member) => (
                                <div
                                    key={member.userId || "unassigned"}
                                    className="p-3 rounded-xl bg-muted/20 border border-border/40 hover:bg-muted/40 transition-colors space-y-2"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 min-w-0">
                                            {member.avatarUrl ? (
                                                <img
                                                    src={resolveAssetUrl(member.avatarUrl)}
                                                    alt={member.name}
                                                    className="h-6 w-6 rounded-full object-cover shrink-0"
                                                />
                                            ) : (
                                                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                                                    {member.name.slice(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                            <span className="text-xs font-semibold truncate">
                                                {member.name}
                                            </span>
                                        </div>

                                        <Badge
                                            variant="outline"
                                            className={`text-[10px] px-1.5 py-0 h-4 border ${WORKLOAD_BADGES[member.workloadLevel]}`}
                                        >
                                            {member.workloadLevel}
                                        </Badge>
                                    </div>

                                    {/* Member Metrics Bar */}
                                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                        <span>
                                            <strong className="text-foreground">{member.totalAssigned}</strong> tasks assigned
                                        </span>
                                        <span>
                                            {member.completed} done ({member.completionRate}%)
                                        </span>
                                    </div>

                                    <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
                                        <div
                                            style={{ width: `${member.completionRate}%` }}
                                            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Milestone Completions Feed */}
                    {recentCompletions.length > 0 && (
                        <div className="rounded-2xl border bg-card/60 backdrop-blur-xs p-5 shadow-xs">
                            <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                Recent Completions
                            </h3>
                            <div className="space-y-2.5">
                                {recentCompletions.map((task) => (
                                    <div
                                        key={task.id}
                                        className="flex items-start justify-between gap-2 text-xs py-1.5 border-b border-border/30 last:border-none"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium text-foreground truncate">
                                                {task.title}
                                            </p>
                                            <span className="text-[10px] text-muted-foreground">
                                                {task.boardName} · {new Date(task.completedAt).toLocaleDateString(undefined, {
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </span>
                                        </div>
                                        {task.assignee && (
                                            <span className="text-[10px] bg-muted/50 rounded-full px-2 py-0.5 text-muted-foreground shrink-0">
                                                {task.assignee.name.split(" ")[0]}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
