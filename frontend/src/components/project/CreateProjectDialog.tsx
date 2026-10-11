import { useState, useEffect } from "react";
import {
    Sparkles,
    Loader2,
    Clock,
    Layers,
    ListTodo,
    AlertCircle,
    ArrowRight,
    ArrowLeft,
    RefreshCw,
    Plus,
    Trash2,
    ChevronDown,
    ChevronUp,
    Check,
    Wand2,
} from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { createProject, type Project } from "@/api/project.api";
import {
    analyzeProjectPlan,
    createProjectFromApprovedPlan,
    checkAIHealth,
    type AnalyzedProjectPlan,
    type AnalyzedMilestone,
    type AnalyzedTask,
    type TaskPriority,
} from "@/api/ai.api";

interface CreateProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    workspaceId: string;
    onCreated: (project: Project) => void | Promise<void>;
}

type TabMode = "ai" | "manual";
type AIStep = "describe" | "review";

const PRIORITY_COLORS: Record<TaskPriority, string> = {
    LOW: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
    MEDIUM: "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400",
    HIGH: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
    URGENT: "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400",
};

export default function CreateProjectDialog({
    open,
    onOpenChange,
    workspaceId,
    onCreated,
}: CreateProjectDialogProps) {
    // Mode toggle: AI Plan Generator vs Standard Manual Form
    const [mode, setMode] = useState<TabMode>("ai");

    // Manual Creation State
    const [manualName, setManualName] = useState("");
    const [manualDescription, setManualDescription] = useState("");
    const [manualLoading, setManualLoading] = useState(false);

    // AI Generation State
    const [aiStep, setAiStep] = useState<AIStep>("describe");
    const [aiInput, setAiInput] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isCreatingPlan, setIsCreatingPlan] = useState(false);
    const [analyzedPlan, setAnalyzedPlan] = useState<AnalyzedProjectPlan | null>(null);
    const [aiHealthMessage, setAiHealthMessage] = useState<string | null>(null);

    // General error state
    const [error, setError] = useState("");

    // Collapsed milestone IDs for review view
    const [collapsedMilestones, setCollapsedMilestones] = useState<Record<number, boolean>>({});

    // Check AI health on dialog open
    useEffect(() => {
        if (open && mode === "ai") {
            checkAIHealth()
                .then((status) => {
                    if (!status.healthy) {
                        setAiHealthMessage(
                            "Local AI provider (Ollama) is offline. Start Ollama to generate AI plans."
                        );
                    } else {
                        setAiHealthMessage(null);
                    }
                })
                .catch(() => {
                    setAiHealthMessage(
                        "Unable to connect to local AI service. Ensure Ollama is running."
                    );
                });
        }
    }, [open, mode]);

    const resetDialog = () => {
        setManualName("");
        setManualDescription("");
        setManualLoading(false);
        setAiStep("describe");
        setAiInput("");
        setAnalyzedPlan(null);
        setError("");
        setIsAnalyzing(false);
        setIsCreatingPlan(false);
        setCollapsedMilestones({});
    };

    const handleOpenChange = (value: boolean) => {
        if (manualLoading || isAnalyzing || isCreatingPlan) return;
        if (!value) {
            resetDialog();
        }
        onOpenChange(value);
    };

    // Manual Create Project handler
    const handleManualCreate = async () => {
        if (!manualName.trim()) {
            setError("Project name is required.");
            return;
        }

        if (manualName.trim().length < 2) {
            setError("Project name must be at least 2 characters.");
            return;
        }

        try {
            setManualLoading(true);
            setError("");

            const newProject = await createProject(workspaceId, {
                name: manualName.trim(),
                description: manualDescription.trim() || undefined,
            });

            handleOpenChange(false);
            await onCreated(newProject);
        } catch (err: any) {
            setError(
                err.response?.data?.message ??
                err.response?.data?.error?.message ??
                "Unable to create project."
            );
        } finally {
            setManualLoading(false);
        }
    };

    // AI Step 1: Analyze / Generate Plan
    const handleGeneratePlan = async () => {
        if (!aiInput.trim()) {
            setError("Please describe your project idea and timeline.");
            return;
        }

        if (aiInput.trim().length < 5) {
            setError("Please provide a bit more description of your project.");
            return;
        }

        try {
            setIsAnalyzing(true);
            setError("");

            const plan = await analyzeProjectPlan(aiInput.trim());
            setAnalyzedPlan(plan);
            setAiStep("review");
        } catch (err: any) {
            console.error("AI plan generation error:", err);
            const msg =
                err.response?.data?.error?.details ??
                err.response?.data?.error?.message ??
                err.response?.data?.message ??
                err.message ??
                "Failed to generate project plan from AI. Make sure Ollama is running.";
            setError(msg);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // AI Step 2: User explicitly clicks "Create Project" after reviewing/editing
    const handleApproveAndCreate = async () => {
        if (!analyzedPlan) return;

        if (!analyzedPlan.name.trim()) {
            setError("Project name cannot be empty.");
            return;
        }

        try {
            setIsCreatingPlan(true);
            setError("");

            const createdProject = await createProjectFromApprovedPlan(
                workspaceId,
                analyzedPlan
            );

            handleOpenChange(false);
            await onCreated(createdProject);
        } catch (err: any) {
            console.error("Failed to create project from plan:", err);
            const msg =
                err.response?.data?.error?.details ??
                err.response?.data?.error?.message ??
                err.response?.data?.message ??
                err.message ??
                "Failed to create project from approved plan.";
            setError(msg);
        } finally {
            setIsCreatingPlan(false);
        }
    };

    // Milestone & Task editable handlers in Review step
    const updatePlanField = (field: "name" | "goal", val: string) => {
        if (!analyzedPlan) return;
        setAnalyzedPlan({ ...analyzedPlan, [field]: val });
    };

    const updateMilestone = (mIdx: number, title: string, desc?: string) => {
        if (!analyzedPlan) return;
        const milestones = [...analyzedPlan.milestones];
        if (milestones[mIdx]) {
            milestones[mIdx] = {
                ...milestones[mIdx],
                title,
                ...(desc !== undefined ? { description: desc } : {}),
            };
            setAnalyzedPlan({ ...analyzedPlan, milestones });
        }
    };

    const deleteMilestone = (mIdx: number) => {
        if (!analyzedPlan) return;
        if (analyzedPlan.milestones.length <= 1) {
            setError("A project must have at least one milestone.");
            return;
        }
        const milestones = analyzedPlan.milestones.filter((_, idx) => idx !== mIdx);
        setAnalyzedPlan({ ...analyzedPlan, milestones });
    };

    const updateTask = (
        mIdx: number,
        tIdx: number,
        updatedFields: Partial<AnalyzedTask>
    ) => {
        if (!analyzedPlan) return;
        const milestones = [...analyzedPlan.milestones];
        const m = milestones[mIdx];
        if (m && m.tasks[tIdx]) {
            const tasks = [...m.tasks];
            tasks[tIdx] = { ...tasks[tIdx]!, ...updatedFields };
            milestones[mIdx] = { ...m, tasks };

            // Recalculate total estimated minutes
            let total = 0;
            for (const ms of milestones) {
                for (const t of ms.tasks) {
                    total += t.estimatedMinutes;
                }
            }

            setAnalyzedPlan({
                ...analyzedPlan,
                milestones,
                totalEstimatedMinutes: total,
            });
        }
    };

    const deleteTask = (mIdx: number, tIdx: number) => {
        if (!analyzedPlan) return;
        const milestones = [...analyzedPlan.milestones];
        const m = milestones[mIdx];
        if (m) {
            if (m.tasks.length <= 1) {
                setError("Each milestone must have at least one task.");
                return;
            }
            const tasks = m.tasks.filter((_, idx) => idx !== tIdx);
            milestones[mIdx] = { ...m, tasks };

            let total = 0;
            for (const ms of milestones) {
                for (const t of ms.tasks) {
                    total += t.estimatedMinutes;
                }
            }

            setAnalyzedPlan({
                ...analyzedPlan,
                milestones,
                totalEstimatedMinutes: total,
            });
        }
    };

    const addTaskToMilestone = (mIdx: number) => {
        if (!analyzedPlan) return;
        const milestones = [...analyzedPlan.milestones];
        const m = milestones[mIdx];
        if (m) {
            const newTask: AnalyzedTask = {
                title: "New Actionable Task",
                description: "",
                priority: "MEDIUM",
                estimatedMinutes: 60,
                dependencies: [],
            };
            milestones[mIdx] = { ...m, tasks: [...m.tasks, newTask] };

            let total = 0;
            for (const ms of milestones) {
                for (const t of ms.tasks) {
                    total += t.estimatedMinutes;
                }
            }

            setAnalyzedPlan({
                ...analyzedPlan,
                milestones,
                totalEstimatedMinutes: total,
            });
        }
    };

    const addMilestone = () => {
        if (!analyzedPlan) return;
        const newMilestone: AnalyzedMilestone = {
            title: `Milestone ${analyzedPlan.milestones.length + 1}`,
            description: "",
            tasks: [
                {
                    title: "First milestone task",
                    description: "",
                    priority: "HIGH",
                    estimatedMinutes: 60,
                    dependencies: [],
                },
            ],
        };
        setAnalyzedPlan({
            ...analyzedPlan,
            milestones: [...analyzedPlan.milestones, newMilestone],
        });
    };

    const toggleMilestoneCollapse = (idx: number) => {
        setCollapsedMilestones((prev) => ({
            ...prev,
            [idx]: !prev[idx],
        }));
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className={
                    mode === "ai" && aiStep === "review"
                        ? "sm:max-w-[760px] max-h-[90vh] flex flex-col"
                        : "sm:max-w-[540px]"
                }
            >
                <DialogHeader>
                    <div className="flex items-center justify-between pr-4">
                        <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                            {mode === "ai" ? (
                                <>
                                    <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                                    <span>AI Project Planner</span>
                                </>
                            ) : (
                                "Create Project"
                            )}
                        </DialogTitle>

                        {/* Top Mode Selector */}
                        <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border text-xs">
                            <button
                                type="button"
                                onClick={() => {
                                    setMode("ai");
                                    setError("");
                                }}
                                className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                                    mode === "ai"
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                <Sparkles className="h-3.5 w-3.5 text-primary" />
                                AI Planner
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setMode("manual");
                                    setError("");
                                }}
                                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                                    mode === "manual"
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                Manual
                            </button>
                        </div>
                    </div>

                    <DialogDescription>
                        {mode === "ai" ? (
                            aiStep === "describe" ? (
                                "Describe your project goal, timeline, and availability. AI will propose a structured milestone roadmap."
                            ) : (
                                "Review and edit the proposed plan below. No database records are created until you approve."
                            )
                        ) : (
                            "Define a project goal, roadmap milestones, and track execution."
                        )}
                    </DialogDescription>
                </DialogHeader>

                {/* AI Health Notice */}
                {mode === "ai" && aiHealthMessage && (
                    <div className="flex items-center gap-2 p-2.5 rounded-md text-xs bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{aiHealthMessage}</span>
                    </div>
                )}

                {/* MANUAL CREATION VIEW */}
                {mode === "manual" && (
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <label
                                htmlFor="project-name"
                                className="text-sm font-medium"
                            >
                                Project Name <span className="text-destructive">*</span>
                            </label>
                            <Input
                                id="project-name"
                                placeholder="e.g. Q4 Website Redesign"
                                value={manualName}
                                onChange={(e) => {
                                    setManualName(e.target.value);
                                    setError("");
                                }}
                                disabled={manualLoading}
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="project-description"
                                className="text-sm font-medium"
                            >
                                Description
                                <span className="ml-1 text-muted-foreground text-xs">
                                    (optional)
                                </span>
                            </label>
                            <Textarea
                                id="project-description"
                                placeholder="What is this project about, and what are the main deliverables?"
                                value={manualDescription}
                                onChange={(e) => setManualDescription(e.target.value)}
                                disabled={manualLoading}
                                rows={4}
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-destructive font-medium flex items-center gap-1.5">
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </p>
                        )}

                        <DialogFooter className="pt-2">
                            <Button
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                disabled={manualLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleManualCreate}
                                disabled={manualLoading}
                            >
                                {manualLoading && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {manualLoading ? "Creating..." : "Create Project"}
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {/* AI PLANNER STEP 1: DESCRIBE */}
                {mode === "ai" && aiStep === "describe" && (
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <label
                                htmlFor="ai-project-input"
                                className="text-sm font-medium flex items-center justify-between"
                            >
                                <span>Describe your project idea & timeframe:</span>
                                <span className="text-xs text-muted-foreground font-normal">
                                    Natural language input
                                </span>
                            </label>
                            <Textarea
                                id="ai-project-input"
                                placeholder="e.g. I want to build an AI powered resume analyzer. I have 3 weeks and can spend 2 hours per day."
                                value={aiInput}
                                onChange={(e) => {
                                    setAiInput(e.target.value);
                                    setError("");
                                }}
                                disabled={isAnalyzing}
                                rows={5}
                                autoFocus
                                className="resize-none"
                            />
                        </div>

                        {/* Quick Prompts */}
                        <div className="space-y-1.5">
                            <span className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">
                                Quick Suggestions
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {[
                                    "Build an AI resume analyzer in 3 weeks, 2 hours/day",
                                    "Launch a multi-tenant SaaS MVP in 4 weeks",
                                    "Redesign our marketing landing page and blog in 10 days",
                                ].map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        type="button"
                                        onClick={() => setAiInput(suggestion)}
                                        className="text-xs px-2.5 py-1 rounded-full bg-secondary/80 hover:bg-secondary text-secondary-foreground transition-colors border text-left"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <p className="text-sm text-destructive font-medium flex items-center gap-1.5">
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </p>
                        )}

                        <DialogFooter className="pt-2">
                            <Button
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                disabled={isAnalyzing}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleGeneratePlan}
                                disabled={isAnalyzing || !aiInput.trim()}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Analyzing & Planning...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="mr-2 h-4 w-4" />
                                        Generate Plan
                                        <ArrowRight className="ml-1.5 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {/* AI PLANNER STEP 2: REVIEW & APPROVE */}
                {mode === "ai" && aiStep === "review" && analyzedPlan && (
                    <div className="flex flex-col flex-1 min-h-0 space-y-4">
                        {/* Summary Header */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 bg-muted/40 rounded-lg border text-xs">
                            <div className="flex items-center gap-2">
                                <Layers className="h-4 w-4 text-primary shrink-0" />
                                <div>
                                    <span className="text-muted-foreground block text-[10px]">
                                        Milestones
                                    </span>
                                    <span className="font-semibold text-foreground">
                                        {analyzedPlan.milestones.length} Milestones
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <ListTodo className="h-4 w-4 text-primary shrink-0" />
                                <div>
                                    <span className="text-muted-foreground block text-[10px]">
                                        Total Tasks
                                    </span>
                                    <span className="font-semibold text-foreground">
                                        {analyzedPlan.milestones.reduce(
                                            (acc, m) => acc + m.tasks.length,
                                            0
                                        )}{" "}
                                        Tasks
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary shrink-0" />
                                <div>
                                    <span className="text-muted-foreground block text-[10px]">
                                        Estimated Effort
                                    </span>
                                    <span className="font-semibold text-foreground">
                                        {analyzedPlan.totalEstimatedMinutes ?? 0} mins (
                                        {Math.round(
                                            ((analyzedPlan.totalEstimatedMinutes ?? 0) / 60) * 10
                                        ) / 10}{" "}
                                        hrs)
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Project Details Fields */}
                        <div className="space-y-2.5">
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">
                                    Project Name
                                </label>
                                <Input
                                    value={analyzedPlan.name}
                                    onChange={(e) => updatePlanField("name", e.target.value)}
                                    placeholder="Project Name"
                                    className="font-medium mt-1"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">
                                    Project Goal
                                </label>
                                <Textarea
                                    value={analyzedPlan.goal}
                                    onChange={(e) => updatePlanField("goal", e.target.value)}
                                    placeholder="Goal & Deliverables"
                                    rows={2}
                                    className="text-xs mt-1 resize-none"
                                />
                            </div>
                        </div>

                        {/* Milestones & Tasks Scrollable List */}
                        <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-[220px] max-h-[380px]">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Roadmap Milestones & Tasks
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={addMilestone}
                                    className="h-7 text-xs text-primary hover:text-primary"
                                >
                                    <Plus className="h-3.5 w-3.5 mr-1" />
                                    Add Milestone
                                </Button>
                            </div>

                            {analyzedPlan.milestones.map((milestone, mIdx) => {
                                const isCollapsed = !!collapsedMilestones[mIdx];

                                return (
                                    <div
                                        key={mIdx}
                                        className="rounded-lg border bg-card p-3 shadow-xs space-y-2.5"
                                    >
                                        {/* Milestone Header */}
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleMilestoneCollapse(mIdx)}
                                                    className="text-muted-foreground hover:text-foreground"
                                                >
                                                    {isCollapsed ? (
                                                        <ChevronDown className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronUp className="h-4 w-4" />
                                                    )}
                                                </button>

                                                <Input
                                                    value={milestone.title}
                                                    onChange={(e) =>
                                                        updateMilestone(mIdx, e.target.value)
                                                    }
                                                    className="h-8 font-semibold text-sm flex-1 bg-transparent border-transparent hover:border-input focus:border-input"
                                                />
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <Badge variant="secondary" className="text-[10px]">
                                                    {milestone.tasks.length} tasks
                                                </Badge>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => deleteMilestone(mIdx)}
                                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                    title="Delete Milestone"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Milestone Tasks */}
                                        {!isCollapsed && (
                                            <div className="space-y-2 pl-4 border-l-2 border-primary/20 ml-2">
                                                {milestone.tasks.map((task, tIdx) => (
                                                    <div
                                                        key={tIdx}
                                                        className="p-2.5 rounded-md border bg-muted/20 hover:bg-muted/40 transition-colors text-xs space-y-2"
                                                    >
                                                        <div className="flex items-center justify-between gap-2">
                                                            <Input
                                                                value={task.title}
                                                                onChange={(e) =>
                                                                    updateTask(mIdx, tIdx, {
                                                                        title: e.target.value,
                                                                    })
                                                                }
                                                                placeholder="Task title"
                                                                className="h-7 text-xs font-medium flex-1"
                                                            />

                                                            {/* Priority Selector */}
                                                            <select
                                                                value={task.priority}
                                                                onChange={(e) =>
                                                                    updateTask(mIdx, tIdx, {
                                                                        priority: e.target
                                                                            .value as TaskPriority,
                                                                    })
                                                                }
                                                                className={`h-7 px-2 rounded-md border text-[11px] font-semibold ${
                                                                    PRIORITY_COLORS[task.priority]
                                                                }`}
                                                            >
                                                                <option value="LOW">LOW</option>
                                                                <option value="MEDIUM">MEDIUM</option>
                                                                <option value="HIGH">HIGH</option>
                                                                <option value="URGENT">URGENT</option>
                                                            </select>

                                                            {/* Estimated Minutes */}
                                                            <div className="flex items-center gap-1 shrink-0 text-muted-foreground">
                                                                <Clock className="h-3.5 w-3.5" />
                                                                <Input
                                                                    type="number"
                                                                    value={task.estimatedMinutes}
                                                                    onChange={(e) =>
                                                                        updateTask(mIdx, tIdx, {
                                                                            estimatedMinutes:
                                                                                parseInt(
                                                                                    e.target.value,
                                                                                    10
                                                                                ) || 30,
                                                                        })
                                                                    }
                                                                    className="h-7 w-16 text-xs text-right"
                                                                    min={5}
                                                                    step={15}
                                                                />
                                                                <span className="text-[10px]">m</span>
                                                            </div>

                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => deleteTask(mIdx, tIdx)}
                                                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>

                                                        {/* Task Description */}
                                                        <Input
                                                            value={task.description || ""}
                                                            onChange={(e) =>
                                                                updateTask(mIdx, tIdx, {
                                                                    description: e.target.value,
                                                                })
                                                            }
                                                            placeholder="Task details or implementation notes (optional)"
                                                            className="h-6 text-[11px] text-muted-foreground"
                                                        />

                                                        {/* Dependencies Display */}
                                                        {task.dependencies &&
                                                            task.dependencies.length > 0 && (
                                                                <div className="flex flex-wrap items-center gap-1 pt-0.5">
                                                                    <span className="text-[10px] text-muted-foreground font-medium">
                                                                        Depends on:
                                                                    </span>
                                                                    {task.dependencies.map(
                                                                        (dep, dIdx) => (
                                                                            <Badge
                                                                                key={dIdx}
                                                                                variant="outline"
                                                                                className="text-[10px] py-0 px-1.5 h-4 bg-background"
                                                                            >
                                                                                {dep}
                                                                            </Badge>
                                                                        )
                                                                    )}
                                                                </div>
                                                            )}
                                                    </div>
                                                ))}

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => addTaskToMilestone(mIdx)}
                                                    className="h-6 text-[11px] text-muted-foreground hover:text-foreground"
                                                >
                                                    <Plus className="h-3 w-3 mr-1" />
                                                    Add Task
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {error && (
                            <p className="text-sm text-destructive font-medium flex items-center gap-1.5">
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </p>
                        )}

                        {/* Review Action Footer */}
                        <DialogFooter className="pt-2 border-t flex items-center justify-between sm:justify-between w-full">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setAiStep("describe")}
                                    disabled={isCreatingPlan}
                                >
                                    <ArrowLeft className="mr-1.5 h-4 w-4" />
                                    Edit Prompt
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleGeneratePlan}
                                    disabled={isAnalyzing || isCreatingPlan}
                                    title="Regenerate proposal with AI"
                                >
                                    {isAnalyzing ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <>
                                            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                                            Regenerate
                                        </>
                                    )}
                                </Button>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    onClick={() => handleOpenChange(false)}
                                    disabled={isCreatingPlan}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleApproveAndCreate}
                                    disabled={isCreatingPlan || !analyzedPlan.name.trim()}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm"
                                >
                                    {isCreatingPlan ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating Project...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="mr-1.5 h-4 w-4" />
                                            Create Project
                                        </>
                                    )}
                                </Button>
                            </div>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
