import { useEffect, useState } from "react";

import type {
    Task,
    TaskPriority,
} from "@/api/task.api";
import type { WorkspaceMember } from "@/api/workspace.api";
import TaskLabelSelector from "./TaskLabelSelector";
import TaskAssigneeSelector from "./TaskAssigneeSelector";
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
import RichTextEditor from "@/components/ui/rich-text-editor";

interface EditTaskDialogProps {
    task: Task | null;
    boardId: string;
    workspaceMembers?: WorkspaceMember[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (
        title: string,
        description: string | null,
        priority: TaskPriority,
        dueDate: string | null,
        assigneeId?: string | null,
    ) => Promise<void>;
    onLabelsChange?: (labels: Task["labels"]) => void;
}

export default function EditTaskDialog({
    task,
    boardId,
    workspaceMembers = [],
    open,
    onOpenChange,
    onSave,
    onLabelsChange,
}: EditTaskDialogProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] =
        useState<TaskPriority>("MEDIUM");
    const [dueDate, setDueDate] = useState("");
    const [assigneeId, setAssigneeId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!task) return;

        setTitle(task.title);
        setDescription(task.description ?? "");
        setPriority(task.priority ?? "MEDIUM");
        setAssigneeId(task.assigneeId ?? null);
        setDueDate(
            task.dueDate
                ? task.dueDate.slice(0, 10)
                : "",
        );
    }, [task]);

    // IMPORTANT:
    // Do not keep a Dialog mounted when there is no task.
    if (!task) {
        return null;
    }

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
                    ? new Date(
                        `${dueDate}T23:59:59`,
                    ).toISOString()
                    : null,
                assigneeId,
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
                                disabled={saving}
                            />
                            <p className="text-[11px] text-muted-foreground">Keep it short and descriptive</p>
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="edit-task-description"
                                className="text-sm font-medium"
                            >
                                Description
                            </label>

                            <RichTextEditor
                                value={description}
                                onChange={setDescription}
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
                            <p className="text-[11px] text-muted-foreground">Helps team know what to tackle first</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Assignee
                                <span className="ml-1 font-normal text-muted-foreground">
                                    (optional)
                                </span>
                            </label>
                            <div>
                                <TaskAssigneeSelector
                                    members={workspaceMembers}
                                    assigneeId={assigneeId}
                                    onAssign={(newId) => setAssigneeId(newId)}
                                    disabled={saving}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Labels
                            </label>

                            <TaskLabelSelector
                                task={task}
                                boardId={boardId}   
                                onLabelsChange={(labels) => {
                                    onLabelsChange?.(labels);
                                }}
                            />
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
                                    setDueDate(
                                        event.target.value,
                                    )
                                }
                                disabled={saving}
                            />
                            <p className="text-[11px] text-muted-foreground">Set a target completion date</p>

                            {dueDate && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        setDueDate("")
                                    }
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