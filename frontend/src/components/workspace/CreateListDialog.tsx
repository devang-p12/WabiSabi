import { useState } from "react";
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
import { createList } from "@/api/list.api";

interface CreateListDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    boardId: string;
    onCreated: () => void | Promise<void>;
}

export default function CreateListDialog({
    open,
    onOpenChange,
    boardId,
    onCreated,
}: CreateListDialogProps) {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleCreate = async () => {
        const trimmedName = name.trim();

        if (!trimmedName) {
            setError("List name is required.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            await createList(boardId, {
                name: trimmedName,
            });

            setName("");
            onOpenChange(false);

            await onCreated();
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                "Failed to create list."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChange = (value: boolean) => {
        if (!value && !loading) {
            setName("");
            setError("");
        }

        onOpenChange(value);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create a list</DialogTitle>

                    <DialogDescription>
                        Add a new column to this board.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2 py-2">
                    <label
                        htmlFor="list-name"
                        className="text-sm font-medium"
                    >
                        List name
                    </label>

                    <Input
                        id="list-name"
                        placeholder="e.g. To Do"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            setError("");
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !loading) {
                                handleCreate();
                            }
                        }}
                        autoFocus
                    />

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
                        disabled={loading || !name.trim()}
                    >
                        {loading ? "Creating..." : "Create list"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}