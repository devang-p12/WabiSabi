import { useState } from "react";
import {
    Sparkles,
    AlertTriangle,
    ShieldAlert,
    CheckCircle2,
    Clock,
    Loader2,
    Check,
    RotateCcw,
    Calendar,
    Flag,
    Ban,
    AlertCircle,
    Info,
} from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    generateAdaptiveReplan,
    applyAdaptiveReplan,
    type AdaptiveReplanResult,
    type ApplyAdaptiveReplanItem,
} from "@/api/ai.api";

interface AdaptiveReplanDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: string;
    projectName: string;
    onReplanApplied: () => void | Promise<void>;
}

const RISK_BADGE: Record<string, { bg: string; text: string; icon: any }> = {
    LOW: {
        bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
        text: "Low Delivery Risk",
        icon: CheckCircle2,
    },
    MEDIUM: {
        bg: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
        text: "Moderate Variance Risk",
        icon: AlertTriangle,
    },
    HIGH: {
        bg: "bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400",
        text: "High Delivery Delay Risk",
        icon: AlertTriangle,
    },
    CRITICAL: {
        bg: "bg-destructive/10 border-destructive/20 text-destructive",
        text: "Critical Delivery Delay",
        icon: ShieldAlert,
    },
};

const ACTION_COLORS: Record<string, string> = {
    CHANGE_PRIORITY: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    ADJUST_ESTIMATE: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    RESCHEDULE: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    MOVE_MILESTONE: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
    SPLIT_TASK: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
    KEEP: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
};

export default function AdaptiveReplanDialog({
    open,
    onOpenChange,
    projectId,
    projectName,
    onReplanApplied,
}: AdaptiveReplanDialogProps) {
    const [loading, setLoading] = useState(false);
    const [applying, setApplying] = useState(false);
    const [error, setError] = useState("");
    const [replanData, setReplanData] = useState<AdaptiveReplanResult | null>(null);

    // Selected suggestions to apply (by taskId)
    const [selectedTasks, setSelectedTasks] = useState<Record<string, boolean>>({});

    const handleGenerateReplan = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await generateAdaptiveReplan(projectId);
            setReplanData(data);

            // Select all suggested changes by default
            const initialSelected: Record<string, boolean> = {};
            for (const change of data.suggestedChanges) {
                initialSelected[change.taskId] = true;
            }
            setSelectedTasks(initialSelected);
        } catch (err: any) {
            console.error("Adaptive replan error:", err);
            setError(
                err.response?.data?.message ??
                err.response?.data?.error?.message ??
                "Failed to generate adaptive replan."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleApplyPlan = async () => {
        if (!replanData) return;

        const changesToApply: ApplyAdaptiveReplanItem[] = [];
        for (const suggestion of replanData.suggestedChanges) {
            if (selectedTasks[suggestion.taskId]) {
                changesToApply.push({
                    taskId: suggestion.taskId,
                    ...(suggestion.suggestedPriority ? { priority: suggestion.suggestedPriority } : {}),
                    ...(suggestion.suggestedEstimatedMinutes ? { estimatedMinutes: suggestion.suggestedEstimatedMinutes } : {}),
                    ...(suggestion.suggestedDueDate ? { dueDate: suggestion.suggestedDueDate } : {}),
                    ...(suggestion.suggestedMilestoneId ? { milestoneId: suggestion.suggestedMilestoneId } : {}),
                });
            }
        }

        if (changesToApply.length === 0) {
            setError("Please select at least one suggested change to apply.");
            return;
        }

        try {
            setApplying(true);
            setError("");

            await applyAdaptiveReplan(projectId, changesToApply);
            onOpenChange(false);
            await onReplanApplied();
        } catch (err: any) {
            console.error("Apply replan error:", err);
            setError(
                err.response?.data?.message ??
                err.response?.data?.error?.message ??
                "Failed to apply replan changes."
            );
        } finally {
            setApplying(false);
        }
    };

    const toggleSuggestion = (taskId: string) => {
        setSelectedTasks((prev) => ({
            ...prev,
            [taskId]: !prev[taskId],
        }));
    };

    const riskInfo = replanData?.risk
        ? RISK_BADGE[replanData.risk.level] ?? RISK_BADGE.MEDIUM
        : RISK_BADGE.MEDIUM;
    const RiskIcon = riskInfo.icon;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[760px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Sparkles className="h-4 w-4" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-semibold">
                                AI Adaptive Replan
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Adapts project roadmap and priorities based on actual time spent and blocked dependencies.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* State 1: Ready to trigger replan analysis */}
                {!replanData && !loading && (
                    <div className="py-8 text-center space-y-4">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
                            <RotateCcw className="h-7 w-7" />
                        </div>
                        <div className="space-y-1 max-w-md mx-auto">
                            <h3 className="text-sm font-semibold">
                                Re-evaluate "{projectName}" Velocity
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Wabi will review your completed tasks, actual elapsed minutes, blocked dependencies, and calculate delivery risks to propose optimal schedule adjustments.
                            </p>
                        </div>

                        {error && (
                            <p className="text-xs text-destructive flex items-center justify-center gap-1.5 font-medium">
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </p>
                        )}

                        <div className="pt-2">
                            <Button
                                onClick={handleGenerateReplan}
                                className="shadow-xs text-xs font-semibold"
                            >
                                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                Run Adaptive Replan Analysis
                            </Button>
                        </div>
                    </div>
                )}

                {/* State 2: Loading Analysis */}
                {loading && (
                    <div className="py-12 flex flex-col items-center justify-center space-y-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <div className="text-center space-y-1">
                            <p className="text-xs font-semibold">Analyzing Execution Velocity...</p>
                            <p className="text-[11px] text-muted-foreground">
                                Inspecting time overruns, prerequisite bottlenecks, and generating revised scheduling...
                            </p>
                        </div>
                    </div>
                )}

                {/* State 3: Structured Replan Review */}
                {replanData && !loading && (
                    <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                        {/* Section 1: Current Situation */}
                        <div className="rounded-xl border bg-muted/20 p-3.5 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Current Situation
                                </span>
                                <Badge variant="secondary" className="text-[11px] font-semibold">
                                    {replanData.currentSituation.progressPercentage}% Completed
                                </Badge>
                            </div>

                            <p className="text-xs font-medium text-foreground">
                                {replanData.currentSituation.summary}
                            </p>

                            {/* Velocity & Variance Metrics */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                                <div className="p-2.5 rounded-lg border bg-background space-y-0.5">
                                    <span className="text-[10px] text-muted-foreground block">Planned vs Actual</span>
                                    <span className="font-semibold text-foreground">
                                        {replanData.currentSituation.totalEstimatedMinutes}m / {replanData.currentSituation.totalActualMinutes}m
                                    </span>
                                </div>

                                <div className="p-2.5 rounded-lg border bg-background space-y-0.5">
                                    <span className="text-[10px] text-muted-foreground block">Variance</span>
                                    <span className={`font-semibold ${replanData.currentSituation.varianceMinutes > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                                        {replanData.currentSituation.varianceMinutes > 0 ? `+${replanData.currentSituation.varianceMinutes}m behind` : `${Math.abs(replanData.currentSituation.varianceMinutes)}m ahead`}
                                    </span>
                                </div>

                                <div className="p-2.5 rounded-lg border bg-background space-y-0.5">
                                    <span className="text-[10px] text-muted-foreground block">Delayed Tasks</span>
                                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                                        {replanData.currentSituation.delayedTasksCount} task(s)
                                    </span>
                                </div>

                                <div className="p-2.5 rounded-lg border bg-background space-y-0.5">
                                    <span className="text-[10px] text-muted-foreground block">Blocked Tasks</span>
                                    <span className="font-semibold text-destructive">
                                        {replanData.currentSituation.blockedTasksCount} task(s)
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Delivery Risk Assessment */}
                        <div className={`rounded-xl border p-3.5 space-y-2 ${riskInfo.bg}`}>
                            <div className="flex items-center gap-2">
                                <RiskIcon className="h-4 w-4 shrink-0" />
                                <span className="text-xs font-bold uppercase tracking-wider">
                                    Delivery Risk: {replanData.risk.level}
                                </span>
                            </div>
                            <p className="text-xs font-medium">
                                {replanData.risk.summary}
                            </p>
                            {replanData.risk.factors.length > 0 && (
                                <ul className="text-[11px] space-y-1 list-disc list-inside opacity-90 pt-1">
                                    {replanData.risk.factors.map((factor, idx) => (
                                        <li key={idx}>{factor}</li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Delayed & Blocked Breakdown (if any) */}
                        {(replanData.delayedTasks.length > 0 || replanData.blockedTasks.length > 0) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {replanData.delayedTasks.length > 0 && (
                                    <div className="rounded-lg border p-3 bg-muted/10 space-y-2">
                                        <div className="flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
                                            <Clock className="h-3.5 w-3.5" />
                                            <span>Delayed Tasks (Actual &gt; Estimated)</span>
                                        </div>
                                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                            {replanData.delayedTasks.map((t) => (
                                                <div key={t.id} className="p-1.5 rounded border bg-background text-[11px] flex justify-between items-center">
                                                    <span className="truncate max-w-[170px] font-medium">{t.title}</span>
                                                    <span className="text-amber-600 dark:text-amber-400 font-semibold shrink-0">
                                                        +{t.overrunMinutes}m ({t.actualMinutes}m / {t.estimatedMinutes}m)
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {replanData.blockedTasks.length > 0 && (
                                    <div className="rounded-lg border p-3 bg-muted/10 space-y-2">
                                        <div className="flex items-center gap-1.5 font-semibold text-destructive">
                                            <Ban className="h-3.5 w-3.5" />
                                            <span>Blocked Tasks</span>
                                        </div>
                                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                            {replanData.blockedTasks.map((t) => (
                                                <div key={t.id} className="p-1.5 rounded border bg-background text-[11px] flex flex-col gap-0.5">
                                                    <span className="truncate font-medium">{t.title}</span>
                                                    <span className="text-[10px] text-muted-foreground truncate">
                                                        Waiting on: {t.blockedBy.join(", ")}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Section 3: Suggested Changes */}
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Suggested Changes ({replanData.suggestedChanges.length})
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                    Select changes to apply
                                </span>
                            </div>

                            {replanData.suggestedChanges.length === 0 ? (
                                <div className="p-4 rounded-lg border text-center text-xs text-muted-foreground">
                                    No changes needed. Your project is tracking close to original estimates!
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {replanData.suggestedChanges.map((suggestion) => {
                                        const isSelected = !!selectedTasks[suggestion.taskId];
                                        const actionColor = ACTION_COLORS[suggestion.action] ?? ACTION_COLORS.KEEP;

                                        return (
                                            <div
                                                key={suggestion.taskId}
                                                onClick={() => toggleSuggestion(suggestion.taskId)}
                                                className={`p-3 rounded-lg border transition-all cursor-pointer space-y-2 ${
                                                    isSelected
                                                        ? "bg-card border-primary/40 shadow-xs ring-1 ring-primary/20"
                                                        : "bg-muted/20 opacity-70 border-border"
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                                                isSelected
                                                                    ? "bg-primary border-primary text-primary-foreground"
                                                                    : "border-muted-foreground/40"
                                                            }`}
                                                        >
                                                            {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                                                        </div>
                                                        <span className="text-xs font-semibold text-foreground">
                                                            {suggestion.taskTitle}
                                                        </span>
                                                    </div>

                                                    <Badge variant="outline" className={`text-[10px] uppercase font-bold ${actionColor}`}>
                                                        {suggestion.action.replace("_", " ")}
                                                    </Badge>
                                                </div>

                                                <p className="text-[11px] text-muted-foreground pl-6">
                                                    {suggestion.reason}
                                                </p>

                                                {/* What changes specifically */}
                                                {(suggestion.suggestedPriority || suggestion.suggestedEstimatedMinutes || suggestion.suggestedDueDate) && (
                                                    <div className="flex items-center gap-3 pl-6 pt-1 text-[11px] text-foreground font-medium">
                                                        {suggestion.suggestedPriority && (
                                                            <div className="flex items-center gap-1">
                                                                <Flag className="h-3 w-3 text-primary" />
                                                                <span>Priority: {suggestion.suggestedPriority}</span>
                                                            </div>
                                                        )}
                                                        {suggestion.suggestedEstimatedMinutes && (
                                                            <div className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3 text-primary" />
                                                                <span>Estimate: {suggestion.suggestedEstimatedMinutes}m</span>
                                                            </div>
                                                        )}
                                                        {suggestion.suggestedDueDate && (
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="h-3 w-3 text-primary" />
                                                                <span>Due: {suggestion.suggestedDueDate}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Revised Plan Summary */}
                            <div className="p-3 rounded-lg border bg-muted/30 text-xs space-y-1">
                                <span className="font-semibold text-foreground flex items-center gap-1.5">
                                    <Info className="h-3.5 w-3.5 text-primary" />
                                    Revised Plan Summary
                                </span>
                                <p className="text-[11px] text-muted-foreground">
                                    {replanData.revisedPlanSummary}
                                </p>
                            </div>
                        </div>

                        {error && (
                            <p className="text-xs text-destructive flex items-center gap-1.5 font-medium">
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </p>
                        )}
                    </div>
                )}

                <DialogFooter className="pt-2 border-t flex items-center justify-between sm:justify-between w-full">
                    {replanData && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateReplan}
                            disabled={loading || applying}
                            className="text-xs"
                        >
                            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                            Recalculate
                        </Button>
                    )}

                    <div className="flex items-center gap-2 ml-auto">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            disabled={loading || applying}
                            className="text-xs"
                        >
                            Cancel
                        </Button>

                        {replanData && (
                            <Button
                                onClick={handleApplyPlan}
                                disabled={applying || replanData.suggestedChanges.length === 0}
                                className="text-xs shadow-xs font-semibold"
                            >
                                {applying ? (
                                    <>
                                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                        Applying Changes...
                                    </>
                                ) : (
                                    <>
                                        <Check className="mr-1.5 h-3.5 w-3.5" />
                                        Apply Plan
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
