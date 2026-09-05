import { useState } from "react";

import { createTask } from "@/api/task.api";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CreateTaskDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    listId: string;
    listName: string;
    onCreated: () => void | Promise<void>;
}

export default function CreateTaskDialog({
    open,
    onOpenChange,
    listId,
    listName,
    onCreated,
}: CreateTaskDialogProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] =
        useState("");

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

            await createTask(listId, {
                title: trimmedTitle,
                description:
                    description.trim() || undefined,
            });

            setTitle("");
            setDescription("");

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
            setError("");
        }

        onOpenChange(value);
    };

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