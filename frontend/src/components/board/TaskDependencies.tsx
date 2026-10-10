import { useEffect, useState } from "react";
import {
    CheckCircle2,
    Circle,
    Link2,
    Loader2,
    Plus,
    Trash2,
    AlertCircle,
    ArrowRight,
} from "lucide-react";

import {
    createTaskDependency,
    deleteTaskDependency,
    getTaskDependencies,
    type Task,
    type TaskDependency,
} from "@/api/task.api";
import { getBoardLists } from "@/api/list.api";
import { getListTasks } from "@/api/task.api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface TaskDependenciesProps {
    task: Task;
    boardId?: string;
    onTaskUpdate?: () => void;
}

export default function TaskDependencies({
    task,
    boardId,
    onTaskUpdate,
}: TaskDependenciesProps) {
    const [dependencies, setDependencies] = useState<TaskDependency[]>(
        task.dependencies ?? []
    );
    const [dependedOnBy, setDependedOnBy] = useState<TaskDependency[]>(
        task.dependedOnBy ?? []
    );
    const [loading, setLoading] = useState(false);
    const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
    const [selectedDependsOnId, setSelectedDependsOnId] = useState<string>("");
    const [isAdding, setIsAdding] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadDeps = async () => {
        try {
            setLoading(true);
            const data = await getTaskDependencies(task.id);
            setDependencies(data.dependencies);
            setDependedOnBy(data.dependedOnBy);
        } catch (err) {
            console.error("Failed to load task dependencies:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDeps();
    }, [task.id]);

    const loadCandidateTasks = async () => {
        if (!boardId) return;
        try {
            const lists = await getBoardLists(boardId);
            const allTasksPromises = lists.map((l) => getListTasks(l.id));
            const tasksArrays = await Promise.all(allTasksPromises);
            const flat = tasksArrays.flat();
            // Filter out self and tasks that are already dependencies
            const currentDepIds = new Set(dependencies.map((d) => d.dependsOnId));
            const candidates = flat.filter(
                (t) => t.id !== task.id && !currentDepIds.has(t.id)
            );
            setAvailableTasks(candidates);
        } catch (err) {
            console.error("Failed to load candidate tasks for dependencies:", err);
        }
    };

    const handleStartAdding = () => {
        setIsAdding(true);
        setError(null);
        loadCandidateTasks();
    };

    const handleAddDependency = async () => {
        if (!selectedDependsOnId) return;
        try {
            setSubmitting(true);
            setError(null);
            await createTaskDependency(task.id, selectedDependsOnId);
            setSelectedDependsOnId("");
            setIsAdding(false);
            await loadDeps();
            onTaskUpdate?.();
        } catch (err: any) {
            setError(
                err.response?.data?.message ??
                err.response?.data?.error ??
                "Failed to add dependency."
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteDependency = async (dependsOnId: string) => {
        try {
            await deleteTaskDependency(task.id, dependsOnId);
            await loadDeps();
            onTaskUpdate?.();
        } catch (err: any) {
            setError(
                err.response?.data?.message ?? "Failed to delete dependency."
            );
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Link2 className="h-3.5 w-3.5" />
                    Dependencies
                </h4>
                {!isAdding && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleStartAdding}
                        className="h-6 px-2 text-xs text-primary hover:text-primary cursor-pointer"
                    >
                        <Plus className="mr-1 h-3 w-3" />
                        Add Dependency
                    </Button>
                )}
            </div>

            {error && (
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-destructive/10 text-destructive text-xs">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Adding new dependency form */}
            {isAdding && (
                <div className="p-3 rounded-lg border bg-muted/30 space-y-2.5">
                    <div className="text-xs font-medium text-foreground">
                        Select a task that must be completed first:
                    </div>
                    <Select
                        value={selectedDependsOnId}
                        onValueChange={(val) => setSelectedDependsOnId(val ?? "")}
                    >
                        <SelectTrigger className="h-8 text-xs bg-background">
                            <SelectValue placeholder="Choose task..." />
                        </SelectTrigger>
                        <SelectContent>
                            {availableTasks.length === 0 ? (
                                <div className="p-2 text-xs text-muted-foreground text-center">
                                    No other tasks available to depend on.
                                </div>
                            ) : (
                                availableTasks.map((candidate) => (
                                    <SelectItem
                                        key={candidate.id}
                                        value={candidate.id}
                                        className="text-xs"
                                    >
                                        <div className="flex items-center gap-2">
                                            {candidate.completed ? (
                                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                            ) : (
                                                <Circle className="h-3 w-3 text-muted-foreground" />
                                            )}
                                            <span className="truncate max-w-[240px]">
                                                {candidate.title}
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>

                    <div className="flex items-center justify-end gap-2 pt-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setIsAdding(false);
                                setError(null);
                            }}
                            className="h-7 text-xs"
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleAddDependency}
                            className="h-7 text-xs"
                            disabled={!selectedDependsOnId || submitting}
                        >
                            {submitting && (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            )}
                            Save Dependency
                        </Button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="py-2 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="space-y-3">
                    {/* Depends on (Prerequisites) */}
                    <div>
                        <div className="text-[11px] font-semibold text-muted-foreground mb-1.5">
                            Depends on ({dependencies.length})
                        </div>
                        {dependencies.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic">
                                No dependencies. This task can be started immediately.
                            </p>
                        ) : (
                            <div className="space-y-1.5">
                                {dependencies.map((dep) => {
                                    const target = dep.dependsOn;
                                    return (
                                        <div
                                            key={dep.id}
                                            className="flex items-center justify-between p-2 rounded-lg border bg-background/80 text-xs hover:border-primary/30 transition-colors"
                                        >
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                {target?.completed ? (
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                                ) : (
                                                    <Circle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                                )}
                                                <span
                                                    className={`truncate font-medium ${
                                                        target?.completed
                                                            ? "line-through text-muted-foreground"
                                                            : "text-foreground"
                                                    }`}
                                                >
                                                    {target?.title ?? "Dependent Task"}
                                                </span>
                                            </div>

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteDependency(dep.dependsOnId)}
                                                className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0 cursor-pointer"
                                                title="Remove dependency"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Depended on by (Blocks) */}
                    {dependedOnBy.length > 0 && (
                        <div>
                            <div className="text-[11px] font-semibold text-muted-foreground mb-1.5">
                                Blocks ({dependedOnBy.length})
                            </div>
                            <div className="space-y-1.5">
                                {dependedOnBy.map((dep) => {
                                    const blocked = dep.task;
                                    return (
                                        <div
                                            key={dep.id}
                                            className="flex items-center justify-between p-2 rounded-lg border bg-muted/20 text-xs"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                <span className="truncate text-muted-foreground">
                                                    {blocked?.title ?? "Waiting Task"}
                                                </span>
                                            </div>
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                                                Waiting
                                            </Badge>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
