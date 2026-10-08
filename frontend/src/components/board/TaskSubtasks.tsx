import { useState, useEffect } from "react";
import { Plus, Trash2, CheckCircle, Circle } from "lucide-react";

import {
    type Subtask,
    getTaskSubtasks,
    createSubtask,
    updateSubtask,
    deleteSubtask,
} from "@/api/subtask.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

interface TaskSubtasksProps {
    taskId: string;
}

export default function TaskSubtasks({ taskId }: TaskSubtasksProps) {
    const [subtasks, setSubtasks] = useState<Subtask[]>([]);
    const [loading, setLoading] = useState(true);
    const [newTitle, setNewTitle] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        const fetchSubtasks = async () => {
            try {
                const data = await getTaskSubtasks(taskId);
                setSubtasks(data);
            } catch (error) {
                console.error("Failed to fetch subtasks:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSubtasks();
    }, [taskId]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = newTitle.trim();
        if (!trimmed || isCreating) return;

        try {
            setIsCreating(true);
            const created = await createSubtask(taskId, { title: trimmed });
            setSubtasks((prev) => [...prev, created]);
            setNewTitle("");
        } catch (error) {
            console.error("Failed to create subtask:", error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleToggle = async (subtask: Subtask) => {
        // Optimistic update
        setSubtasks((prev) =>
            prev.map((s) =>
                s.id === subtask.id ? { ...s, completed: !s.completed } : s
            )
        );

        try {
            await updateSubtask(subtask.id, { completed: !subtask.completed });
        } catch (error) {
            console.error("Failed to toggle subtask:", error);
            // Revert
            setSubtasks((prev) =>
                prev.map((s) =>
                    s.id === subtask.id ? { ...s, completed: subtask.completed } : s
                )
            );
        }
    };

    const handleDelete = async (subtask: Subtask) => {
        if (!confirm("Delete this subtask?")) return;
        try {
            await deleteSubtask(subtask.id);
            setSubtasks((prev) => prev.filter((s) => s.id !== subtask.id));
        } catch (error) {
            console.error("Failed to delete subtask:", error);
        }
    };

    const completedCount = subtasks.filter((s) => s.completed).length;
    const progress = subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0;

    if (loading) {
        return <div className="text-sm text-muted-foreground py-2">Loading checklists...</div>;
    }

    return (
        <div className="space-y-4">
            {subtasks.length > 0 && (
                <div className="flex items-center gap-4 py-2">
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                        {completedCount} / {subtasks.length}
                    </span>
                    <Progress value={progress} className="h-2 flex-1" />
                </div>
            )}

            <div className="space-y-2">
                {subtasks.map((subtask) => (
                    <div
                        key={subtask.id}
                        className="group flex items-start gap-2 rounded-md border bg-card px-3 py-2 shadow-sm transition-colors hover:border-primary/50"
                    >
                        <button
                            type="button"
                            className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors"
                            onClick={() => handleToggle(subtask)}
                        >
                            {subtask.completed ? (
                                <CheckCircle className="h-4 w-4 text-primary" />
                            ) : (
                                <Circle className="h-4 w-4" />
                            )}
                        </button>

                        <span
                            className={`flex-1 text-sm ${
                                subtask.completed ? "text-muted-foreground line-through" : ""
                            }`}
                        >
                            {subtask.title}
                        </span>

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDelete(subtask)}
                        >
                            <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                    </div>
                ))}
            </div>

            <form onSubmit={handleCreate} className="flex gap-2">
                <Input
                    placeholder="Add an item..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    disabled={isCreating}
                    className="h-9 text-sm"
                />
                <Button type="submit" size="sm" disabled={!newTitle.trim() || isCreating}>
                    <Plus className="mr-1 h-4 w-4" />
                    Add
                </Button>
            </form>
        </div>
    );
}
