import { useState } from "react";
import { Loader2 } from "lucide-react";

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

import { createBoard } from "@/api/board.api";

interface CreateBoardDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    workspaceId: string;
    onCreated: () => void | Promise<void>;
}

export default function CreateBoardDialog({
    open,
    onOpenChange,
    workspaceId,
    onCreated,
}: CreateBoardDialogProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleCreate = async () => {
        if (!name.trim()) {
            setError("Board name is required.");
            return;
        }

        if (name.trim().length < 2) {
            setError("Board name must be at least 2 characters.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            await createBoard(workspaceId, {
                name: name.trim(),
                description: description.trim() || undefined,
            });

            setName("");
            setDescription("");

            onOpenChange(false);

            await onCreated();
        } catch (error: any) {
            setError(
                error.response?.data?.error?.message ??
                    "Unable to create board."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChange = (value: boolean) => {
        if (loading) return;

        if (!value) {
            setName("");
            setDescription("");
            setError("");
        }

        onOpenChange(value);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create board</DialogTitle>

                    <DialogDescription>
                        Create a new board for this workspace.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <label
                            htmlFor="board-name"
                            className="text-sm font-medium"
                        >
                            Board name
                        </label>

                        <Input
                            id="board-name"
                            placeholder="e.g. Product Development"
                            value={name}
                            onChange={(event) => {
                                setName(event.target.value);
                                setError("");
                            }}
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="board-description"
                            className="text-sm font-medium"
                        >
                            Description
                            <span className="ml-1 text-muted-foreground">
                                (optional)
                            </span>
                        </label>

                        <Textarea
                            id="board-description"
                            placeholder="What is this board for?"
                            value={description}
                            onChange={(event) =>
                                setDescription(event.target.value)
                            }
                            disabled={loading}
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
                        onClick={() => handleOpenChange(false)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={handleCreate}
                        disabled={loading}
                    >
                        {loading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}

                        {loading ? "Creating..." : "Create board"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}