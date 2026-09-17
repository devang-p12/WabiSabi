import { useEffect, useState } from "react";

import type {
    Task,
    TaskPriority,
} from "@/api/task.api";

import { Button } from "@/components/ui/button";
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

interface EditTaskDialogProps {
    task: Task | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (
        title: string,
        description: string | null,
        priority: TaskPriority,
        dueDate: string | null,
    ) => Promise<void>;
}

export default function EditTaskDialog({
    task,
    open,
    onOpenChange,
    onSave,
}: EditTaskDialogProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] =
        useState<TaskPriority>("MEDIUM");
    const [dueDate, setDueDate] = useState("");

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDescription(task.description ?? "");
            setPriority(task.priority ?? "MEDIUM");

        }
    }, [task]);

    const handleSubmit = async (
        event: React.FormEvent,
    ) => {
        event.preventDefault();

        const trimmedTitle = title.trim();

        if (!trimmedTitle) {
            return;
        }

        try {
            setSaving(true);

            await onSave(
                trimmedTitle,
                description.trim() || null,
                priority,
                dueDate
                    ? new Date(`${dueDate}T23:59:59`).toISOString()
                    : null,
            );

            onOpenChange(false);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(value) => {
                if (!saving) {
                    onOpenChange(value);
                }
            }}
        >
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>
                            Edit task
                        </DialogTitle>

                        <DialogDescription>
                            Update the task details.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label
                                htmlFor="edit-task-title"
                                className="text-sm font-medium"
                            >
                                Title
                            </label>

                            <Input
                                id="edit-task-title"
                                value={title}
                                onChange={(event) =>
                                    setTitle(
                                        event.target.value,
                                    )
                                }
                                maxLength={200}
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="edit-task-description"
                                className="text-sm font-medium"
                            >
                                Description
                            </label>

                            <Textarea
                                id="edit-task-description"
                                value={description}
                                onChange={(event) =>
                                    setDescription(
                                        event.target.value,
                                    )
                                }
                                maxLength={5000}
                                rows={5}
                                placeholder="Add a description..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="edit-task-priority"
                                className="text-sm font-medium"
                            >
                                Priority
                            </label>

                            <select
                                id="edit-task-priority"
                                value={priority}
                                onChange={(event) =>
                                    setPriority(
                                        event.target
                                            .value as TaskPriority,
                                    )
                                }
                                disabled={saving}
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
                                htmlFor="edit-task-due-date"
                                className="text-sm font-medium"
                            >
                                Due date
                                <span className="ml-1 font-normal text-muted-foreground">
                                    (optional)
                                </span>
                            </label>

                            <Input
                                id="edit-task-due-date"
                                type="date"
                                value={dueDate}
                                onChange={(event) =>
                                    setDueDate(event.target.value)
                                }
                                disabled={saving}
                            />

                            {dueDate && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDueDate("")}
                                    disabled={saving}
                                >
                                    Clear due date
                                </Button>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                onOpenChange(false)
                            }
                            disabled={saving}
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            disabled={
                                saving ||
                                !title.trim()
                            }
                        >
                            {saving
                                ? "Saving..."
                                : "Save changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}