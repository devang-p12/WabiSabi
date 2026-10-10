import { useState } from "react";
import {
    Clock,
    Hourglass,
    Play,
    CheckCircle2,
    Save,
} from "lucide-react";

import { type Task, updateTask } from "@/api/task.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TaskPlanningFieldsProps {
    task: Task;
    onTaskUpdate?: (updatedTask: Task) => void;
}

export default function TaskPlanningFields({
    task,
    onTaskUpdate,
}: TaskPlanningFieldsProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [estimated, setEstimated] = useState<string>(
        task.estimatedMinutes !== null && task.estimatedMinutes !== undefined
            ? String(task.estimatedMinutes)
            : ""
    );
    const [actual, setActual] = useState<string>(
        task.actualMinutes !== null && task.actualMinutes !== undefined
            ? String(task.actualMinutes)
            : ""
    );
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        try {
            setSaving(true);
            const estVal = estimated.trim() ? parseInt(estimated, 10) : null;
            const actVal = actual.trim() ? parseInt(actual, 10) : null;

            const updated = await updateTask(task.id, {
                estimatedMinutes: estVal,
                actualMinutes: actVal,
            });

            setIsEditing(false);
            onTaskUpdate?.(updated);
        } catch (err) {
            console.error("Failed to update task planning time:", err);
        } finally {
            setSaving(false);
        }
    };

    const handleStartNow = async () => {
        try {
            setSaving(true);
            const updated = await updateTask(task.id, {
                startedAt: new Date().toISOString(),
            });
            onTaskUpdate?.(updated);
        } catch (err) {
            console.error("Failed to mark task started:", err);
        } finally {
            setSaving(false);
        }
    };

    const formatMinutes = (mins?: number | null) => {
        if (mins === null || mins === undefined) return "Not set";
        if (mins < 60) return `${mins}m`;
        const hrs = Math.floor(mins / 60);
        const rem = mins % 60;
        return rem > 0 ? `${hrs}h ${rem}m (${mins}m)` : `${hrs}h (${mins}m)`;
    };

    const formatDate = (isoString?: string | null) => {
        if (!isoString) return null;
        return new Date(isoString).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Hourglass className="h-3.5 w-3.5" />
                    Planning & Estimates
                </h4>
                {!isEditing ? (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="h-6 px-2 text-xs text-primary hover:text-primary cursor-pointer"
                    >
                        Edit Time
                    </Button>
                ) : (
                    <Button
                        type="button"
                        size="sm"
                        onClick={handleSave}
                        disabled={saving}
                        className="h-6 px-2 text-xs"
                    >
                        <Save className="mr-1 h-3 w-3" />
                        Save
                    </Button>
                )}
            </div>

            {isEditing ? (
                <div className="p-3 rounded-lg border bg-muted/20 space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[11px] font-medium text-muted-foreground">
                                Estimate (mins)
                            </label>
                            <Input
                                type="number"
                                min="0"
                                placeholder="e.g. 60"
                                value={estimated}
                                onChange={(e) => setEstimated(e.target.value)}
                                className="h-8 text-xs mt-1 bg-background"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] font-medium text-muted-foreground">
                                Actual (mins)
                            </label>
                            <Input
                                type="number"
                                min="0"
                                placeholder="e.g. 45"
                                value={actual}
                                onChange={(e) => setActual(e.target.value)}
                                className="h-8 text-xs mt-1 bg-background"
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-2 text-xs">
                    {/* Estimates display */}
                    <div className="flex items-center justify-between p-2 rounded-lg border bg-background/60">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            Estimated
                        </span>
                        <span className="font-semibold text-foreground">
                            {formatMinutes(task.estimatedMinutes)}
                        </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg border bg-background/60">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                            <Hourglass className="h-3.5 w-3.5" />
                            Actual Time
                        </span>
                        <span className="font-semibold text-foreground">
                            {formatMinutes(task.actualMinutes)}
                        </span>
                    </div>

                    {/* Execution Dates */}
                    <div className="pt-1 space-y-1.5 text-[11px] text-muted-foreground">
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1">
                                <Play className="h-3 w-3 text-muted-foreground" />
                                Started:
                            </span>
                            {task.startedAt ? (
                                <span className="font-medium text-foreground">
                                    {formatDate(task.startedAt)}
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleStartNow}
                                    className="text-primary hover:underline font-medium cursor-pointer"
                                    disabled={saving}
                                >
                                    Mark started now
                                </button>
                            )}
                        </div>

                        {task.completedAt && (
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Completed:
                                </span>
                                <span className="font-medium text-foreground">
                                    {formatDate(task.completedAt)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
