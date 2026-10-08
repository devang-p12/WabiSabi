import { useState, useMemo } from "react";
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    CheckCircle2,
    Circle,
    PanelRightClose,
    PanelRightOpen,
    Clock,
} from "lucide-react";
import { cn } from "cn";

import type { BoardList } from "@/api/list.api";
import type { Task, TaskPriority } from "@/api/task.api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BoardCalendarViewProps {
    lists: BoardList[];
    tasks: Record<string, Task[]>;
    getVisibleTasks: (tasks: Task[]) => Task[];
    onViewTask: (task: Task) => void;
    onCompletedChange: (task: Task) => void;
    onAddTaskForDate: (dateString: string) => void;
}

const priorityDotColors: Record<TaskPriority, string> = {
    LOW: "bg-slate-400",
    MEDIUM: "bg-blue-500",
    HIGH: "bg-amber-500",
    URGENT: "bg-rose-500",
};

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function BoardCalendarView({
    lists,
    tasks,
    getVisibleTasks,
    onViewTask,
    onCompletedChange,
    onAddTaskForDate,
}: BoardCalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(() => new Date());
    const [showUnscheduled, setShowUnscheduled] = useState(true);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthName = useMemo(() => {
        return new Intl.DateTimeFormat("en-US", {
            month: "long",
            year: "numeric",
        }).format(currentDate);
    }, [currentDate]);

    // Flatten all visible tasks across lists
    const { tasksByDate, unscheduledTasks } = useMemo(() => {
        const byDate: Record<string, { task: Task; listName: string }[]> = {};
        const unscheduled: { task: Task; listName: string }[] = [];

        for (const list of lists) {
            const listTasks = tasks[list.id] ?? [];
            const visible = getVisibleTasks(listTasks);

            for (const task of visible) {
                if (task.dueDate) {
                    const d = new Date(task.dueDate);
                    // Format YYYY-MM-DD using local time
                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, "0");
                    const day = String(d.getDate()).padStart(2, "0");
                    const key = `${y}-${m}-${day}`;

                    if (!byDate[key]) byDate[key] = [];
                    byDate[key].push({ task, listName: list.name });
                } else {
                    unscheduled.push({ task, listName: list.name });
                }
            }
        }

        return { tasksByDate: byDate, unscheduledTasks: unscheduled };
    }, [lists, tasks, getVisibleTasks]);

    // Generate grid calendar days (always 35 or 42 days)
    const calendarDays = useMemo(() => {
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const daysInMonth = lastDayOfMonth.getDate();
        const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday

        const daysInPrevMonth = new Date(year, month, 0).getDate();

        const cells = [];

        // Previous month days
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            const d = daysInPrevMonth - i;
            const prevMonthDate = new Date(year, month - 1, d);
            const y = prevMonthDate.getFullYear();
            const m = String(prevMonthDate.getMonth() + 1).padStart(2, "0");
            const dayStr = String(d).padStart(2, "0");
            cells.push({
                dateString: `${y}-${m}-${dayStr}`,
                dayNumber: d,
                isCurrentMonth: false,
                dateObj: prevMonthDate,
            });
        }

        // Current month days
        for (let d = 1; d <= daysInMonth; d++) {
            const currentMonthDate = new Date(year, month, d);
            const m = String(month + 1).padStart(2, "0");
            const dayStr = String(d).padStart(2, "0");
            cells.push({
                dateString: `${year}-${m}-${dayStr}`,
                dayNumber: d,
                isCurrentMonth: true,
                dateObj: currentMonthDate,
            });
        }

        // Next month trailing days to complete weeks
        const remaining = 42 - cells.length;
        const totalCells = remaining < 7 ? cells.length + remaining : cells.length + (remaining - 7);

        const neededNextDays = (totalCells <= 35 && cells.length <= 35) ? 35 - cells.length : 42 - cells.length;

        for (let d = 1; d <= neededNextDays; d++) {
            const nextMonthDate = new Date(year, month + 1, d);
            const y = nextMonthDate.getFullYear();
            const m = String(nextMonthDate.getMonth() + 1).padStart(2, "0");
            const dayStr = String(d).padStart(2, "0");
            cells.push({
                dateString: `${y}-${m}-${dayStr}`,
                dayNumber: d,
                isCurrentMonth: false,
                dateObj: nextMonthDate,
            });
        }

        return cells;
    }, [year, month]);

    const todayStr = useMemo(() => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, "0");
        const d = String(now.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    }, []);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    return (
        <div className="flex flex-1 overflow-hidden bg-background">
            {/* Main Calendar View */}
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                {/* Calendar Header Controls */}
                <div className="flex h-12 shrink-0 items-center justify-between border-b px-4 bg-muted/20">
                    <div className="flex items-center gap-2">
                        <h2 className="text-base font-semibold tracking-tight">
                            {monthName}
                        </h2>

                        <div className="flex items-center rounded-lg border bg-background p-0.5 ml-2 shadow-xs">
                            <button
                                type="button"
                                onClick={handlePrevMonth}
                                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                                title="Previous month"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                onClick={handleToday}
                                className="rounded-md px-2 py-0.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                            >
                                Today
                            </button>
                            <button
                                type="button"
                                onClick={handleNextMonth}
                                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                                title="Next month"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowUnscheduled((prev) => !prev)}
                            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                        >
                            {showUnscheduled ? (
                                <PanelRightClose className="h-3.5 w-3.5" />
                            ) : (
                                <PanelRightOpen className="h-3.5 w-3.5" />
                            )}
                            <span className="hidden sm:inline">Unscheduled</span>
                            {unscheduledTasks.length > 0 && (
                                <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                                    {unscheduledTasks.length}
                                </Badge>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Day of Week Labels */}
                <div className="grid grid-cols-7 border-b bg-muted/30 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {dayNames.map((name) => (
                        <div key={name} className="py-2 border-r last:border-r-0">
                            {name}
                        </div>
                    ))}
                </div>

                {/* Calendar Days Grid */}
                <div className="grid flex-1 grid-cols-7 auto-rows-fr overflow-y-auto divide-x divide-y divide-border/60">
                    {calendarDays.map((cell) => {
                        const isToday = cell.dateString === todayStr;
                        const cellTasks = tasksByDate[cell.dateString] ?? [];

                        return (
                            <div
                                key={cell.dateString}
                                className={cn(
                                    "group relative flex min-h-[95px] flex-col p-1.5 transition-colors hover:bg-muted/30",
                                    !cell.isCurrentMonth && "bg-muted/10 opacity-55 text-muted-foreground",
                                    isToday && "bg-primary/5"
                                )}
                            >
                                {/* Day Number Header */}
                                <div className="flex items-center justify-between pb-1">
                                    <span
                                        className={cn(
                                            "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-all",
                                            isToday
                                                ? "bg-primary text-primary-foreground font-bold shadow-xs"
                                                : "text-foreground"
                                        )}
                                    >
                                        {cell.dayNumber}
                                    </span>

                                    {/* Quick add button on hover */}
                                    <button
                                        type="button"
                                        onClick={() => onAddTaskForDate(cell.dateString)}
                                        className="opacity-0 group-hover:opacity-100 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
                                        title={`Add task for ${cell.dateString}`}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </button>
                                </div>

                                {/* Task Chips */}
                                <div className="flex-1 space-y-1 overflow-y-auto pr-0.5">
                                    {cellTasks.slice(0, 3).map(({ task, listName }) => {
                                        const dotColor = priorityDotColors[task.priority] || "bg-blue-500";
                                        const isOverdue =
                                            !task.completed &&
                                            cell.dateString < todayStr;

                                        return (
                                            <div
                                                key={task.id}
                                                onClick={() => onViewTask(task)}
                                                className={cn(
                                                    "group/item flex items-center gap-1.5 rounded-md border border-border/60 bg-card px-1.5 py-1 text-xs shadow-2xs transition-all hover:border-primary hover:shadow-xs cursor-pointer",
                                                    task.completed && "opacity-60 bg-muted/40",
                                                    isOverdue && "border-rose-300 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20"
                                                )}
                                                title={`${task.title} (${listName})`}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onCompletedChange(task);
                                                    }}
                                                    className="shrink-0 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                                                >
                                                    {task.completed ? (
                                                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                                    ) : (
                                                        <Circle className="h-3 w-3" />
                                                    )}
                                                </button>

                                                <span
                                                    className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotColor)}
                                                />

                                                <span
                                                    className={cn(
                                                        "truncate flex-1 font-medium leading-none",
                                                        task.completed && "line-through text-muted-foreground font-normal"
                                                    )}
                                                >
                                                    {task.title}
                                                </span>
                                            </div>
                                        );
                                    })}

                                    {cellTasks.length > 3 && (
                                        <div className="text-[10px] font-semibold text-muted-foreground pl-1">
                                            +{cellTasks.length - 3} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Unscheduled Tasks Drawer */}
            {showUnscheduled && (
                <div className="w-64 sm:w-72 border-l bg-muted/10 flex flex-col shrink-0 overflow-hidden">
                    <div className="flex h-12 items-center justify-between border-b px-4 bg-muted/20">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Unscheduled
                            </h3>
                        </div>
                        <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                            {unscheduledTasks.length}
                        </Badge>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {unscheduledTasks.length === 0 ? (
                            <div className="py-8 text-center text-xs text-muted-foreground">
                                All tasks have due dates assigned!
                            </div>
                        ) : (
                            unscheduledTasks.map(({ task, listName }) => {
                                const dotColor = priorityDotColors[task.priority] || "bg-blue-500";

                                return (
                                    <div
                                        key={task.id}
                                        onClick={() => onViewTask(task)}
                                        className="group rounded-lg border bg-card p-2.5 text-xs shadow-2xs transition-all hover:border-primary hover:shadow-xs cursor-pointer"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onCompletedChange(task);
                                                    }}
                                                    className="shrink-0 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                                                >
                                                    {task.completed ? (
                                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                                    ) : (
                                                        <Circle className="h-3.5 w-3.5" />
                                                    )}
                                                </button>
                                                <span
                                                    className={cn(
                                                        "truncate font-medium",
                                                        task.completed && "line-through text-muted-foreground"
                                                    )}
                                                >
                                                    {task.title}
                                                </span>
                                            </div>

                                            <span className={cn("h-2 w-2 shrink-0 rounded-full", dotColor)} />
                                        </div>

                                        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                                            <span className="truncate">{listName}</span>
                                            <span className="text-[10px] text-primary hover:underline">
                                                Set date →
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
