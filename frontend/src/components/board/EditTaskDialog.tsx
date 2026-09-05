import { useEffect, useState } from "react";

import type { Task } from "@/api/task.api";

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
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDescription(task.description ?? "");
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