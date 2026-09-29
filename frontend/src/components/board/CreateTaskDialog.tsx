import { useEffect, useState } from "react";

import {
    createTask,
    type TaskPriority,
} from "@/api/task.api";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    getBoardLabels,
    addLabelToTask,
    type Label,
} from "@/api/label.api";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CreateTaskDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    listId: string;
    listName: string;
    boardId: string;
    onCreated: () => void | Promise<void>;
}

export default function CreateTaskDialog({
    open,
    onOpenChange,
    listId,
    listName,
    boardId,
    onCreated,
}: CreateTaskDialogProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] =
        useState<TaskPriority>("MEDIUM");
    const [dueDate, setDueDate] = useState("");
    const [boardLabels, setBoardLabels] = useState<Label[]>([]);
    const [selectedLabels, setSelectedLabels] = useState<Label[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleCreate = async () => {
        const trimmedTitle = title.trim();

        if (!trimmedTitle) {
            setError("Task title is required.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const createdTask = await createTask(listId, {
                title: trimmedTitle,
                description:
                    description.trim() || undefined,
                priority,
                dueDate: dueDate
                    ? new Date(`${dueDate}T23:59:59`).toISOString()
                    : null,
            });

            console.log("Created task:", createdTask);
            console.log("Selected labels:", selectedLabels);

            for (const label of selectedLabels) {
                console.log("Assigning label:", {
                    taskId: createdTask.id,
                    labelId: label.id,
                    labelName: label.name,
                });

                await addLabelToTask(
                    createdTask.id,
                    label.id
                );
            }

            setTitle("");
            setDescription("");
            setPriority("MEDIUM");
            setDueDate("");
            setSelectedLabels([]);
            onOpenChange(false);

            await onCreated();
        } catch (error: any) {
            setError(
                error?.response?.data?.message ||
                "Failed to create task."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChange = (value: boolean) => {
        if (!value && !loading) {
            setTitle("");
            setDescription("");
            setPriority("MEDIUM");
            setDueDate("");
            setSelectedLabels([]);
            setError("");
        }

        onOpenChange(value);
    };

    useEffect(() => {
        const fetchLabels = async () => {
            if (!boardId) return;

            try {
                const labels = await getBoardLabels(boardId);
                console.log("Fetched labels:", labels);
                setBoardLabels(labels);
            } catch (error) {
                console.error(
                    "Failed to fetch board labels:",
                    error
                );
            }
        };

        if (open) {
            fetchLabels();
        }
    }, [open, boardId]);

    return (
        <Dialog
            open={open}
            onOpenChange={handleOpenChange}
        >
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        Create a task
                    </DialogTitle>

                    <DialogDescription>
                        Add a task to{" "}
                        <span className="font-medium">
                            {listName}
                        </span>
                        .
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <label
                            htmlFor="task-title"
                            className="text-sm font-medium"
                        >
                            Title
                        </label>

                        <Input
                            id="task-title"
                            value={title}
                            onChange={(event) => {
                                setTitle(event.target.value);
                                setError("");
                            }}
                            placeholder="e.g. Implement authentication"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="task-description"
                            className="text-sm font-medium"
                        >
                            Description
                            <span className="ml-1 font-normal text-muted-foreground">
                                (optional)
                            </span>
                        </label>

                        <Textarea
                            id="task-description"
                            value={description}
                            onChange={(event) =>
                                setDescription(
                                    event.target.value
                                )
                            }
                            placeholder="Describe what needs to be done..."
                            rows={4}
                        />
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="task-priority"
                            className="text-sm font-medium"
                        >
                            Priority
                        </label>

                        <select
                            id="task-priority"
                            value={priority}
                            onChange={(event) =>
                                setPriority(
                                    event.target.value as TaskPriority
                                )
                            }
                            disabled={loading}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="LOW">
                                Low
                            </option>

                            <option value="MEDIUM">
                                Medium
                            </option>

                            <option value="HIGH">
                                High
                            </option>

                            <option value="URGENT">
                                Urgent
                            </option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label
                            htmlFor="task-due-date"
                            className="text-sm font-medium"
                        >
                            Due date
                            <span className="ml-1 font-normal text-muted-foreground">
                                (optional)
                            </span>
                        </label>

                        <Input
                            id="task-due-date"
                            type="date"
                            value={dueDate}
                            onChange={(event) =>
                                setDueDate(event.target.value)
                            }
                            disabled={loading}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Labels
                        </label>

                        {selectedLabels.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {selectedLabels.map((label) => (
                                    <button
                                        key={label.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedLabels((current) =>
                                                current.filter(
                                                    (item) =>
                                                        item.id !== label.id
                                                )
                                            );
                                        }}
                                        className="rounded-full px-2.5 py-1 text-xs font-medium text-white"
                                        style={{
                                            backgroundColor: label.color,
                                        }}
                                    >
                                        {label.name} ×
                                    </button>
                                ))}
                            </div>
                        )}

                        {boardLabels.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No labels created for this board.
                            </p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {boardLabels
                                    .filter(
                                        (label) =>
                                            !selectedLabels.some(
                                                (selected) =>
                                                    selected.id === label.id
                                            )
                                    )
                                    .map((label) => (
                                        <button
                                            key={label.id}
                                            type="button"
                                            disabled={loading}
                                            onClick={() => {
                                                setSelectedLabels((current) => [
                                                    ...current,
                                                    label,
                                                ]);
                                            }}
                                            className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
                                        >
                                            <span
                                                className="h-3 w-3 rounded-full"
                                                style={{
                                                    backgroundColor:
                                                        label.color,
                                                }}
                                            />

                                            {label.name}
                                        </button>
                                    ))}
                            </div>
                        )}
                    </div>

                    {error && (
                        <p className="text-sm text-destructive">
                            {error}
                        </p>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() =>
                            handleOpenChange(false)
                        }
                        disabled={loading}
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={handleCreate}
                        disabled={
                            loading ||
                            !title.trim()
                        }
                    >
                        {loading
                            ? "Creating..."
                            : "Create task"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
