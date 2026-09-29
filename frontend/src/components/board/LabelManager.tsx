import { useEffect, useState } from "react";

import {
    createLabel,
    deleteLabel,
    getBoardLabels,
    updateLabel,
    type Label,
} from "@/api/label.api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import {
    Pencil,
    Plus,
    Tags,
    Trash2,
} from "lucide-react";

interface LabelManagerProps {
    boardId: string;
    onLabelsChange?: () => void;
}

const DEFAULT_COLOR = "#3B82F6";

export default function LabelManager({
    boardId,
    onLabelsChange,
}: LabelManagerProps) {
    const [labels, setLabels] = useState<Label[]>([]);
    const [loading, setLoading] = useState(true);

    const [open, setOpen] = useState(false);

    const [name, setName] = useState("");
    const [color, setColor] = useState(DEFAULT_COLOR);

    const [editingLabel, setEditingLabel] =
        useState<Label | null>(null);

    const fetchLabels = async () => {
        try {
            setLoading(true);

            const data = await getBoardLabels(boardId);

            setLabels(data);
        } catch (error) {
            console.error(
                "Failed to fetch labels:",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLabels();
    }, [boardId]);

    const resetForm = () => {
        setName("");
        setColor(DEFAULT_COLOR);
        setEditingLabel(null);
    };

    const handleCreate = async () => {
        if (!name.trim()) return;

        try {
            console.log("Creating label:", {
                boardId,
                name: name.trim(),
                color,
            });

            const label = await createLabel(boardId, {
                name: name.trim(),
                color,
            });

            console.log("Created label:", label);

            setLabels((prev) => [...prev, label]);

            resetForm();
        } catch (error: any) {
            console.error("Failed to create label:", error);
            console.error("Response:", error?.response?.data);
        }
    };

    const handleUpdate = async () => {
        if (!editingLabel || !name.trim()) return;

        try {
            const updatedLabel = await updateLabel(
                editingLabel.id,
                {
                    name: name.trim(),
                    color,
                }
            );

            setLabels((prev) =>
                prev.map((label) =>
                    label.id === updatedLabel.id
                        ? updatedLabel
                        : label
                )
            );

            resetForm();
        } catch (error) {
            console.error(
                "Failed to update label:",
                error
            );
        }
    };

    const handleDelete = async (labelId: string) => {
        await deleteLabel(labelId);

        setLabels((prev) => prev.filter((label) => label.id !== labelId));

        await onLabelsChange?.();
    };

    const openEdit = (label: Label) => {
        setEditingLabel(label);
        setName(label.name);
        setColor(label.color);
    };

    const handleDialogChange = (value: boolean) => {
        setOpen(value);

        if (!value) {
            resetForm();
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={handleDialogChange}
        >
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                >
                    <Tags className="mr-1.5 h-3.5 w-3.5" />
                    Labels
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        Board labels
                    </DialogTitle>

                    <DialogDescription>
                        Create and manage labels for this
                        board.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Existing labels */}
                    <div className="space-y-2">
                        {loading ? (
                            <div className="py-4 text-center text-sm text-muted-foreground">
                                Loading labels...
                            </div>
                        ) : labels.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-6 text-center">
                                <Tags className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />

                                <p className="text-sm text-muted-foreground">
                                    No labels yet
                                </p>
                            </div>
                        ) : (
                            labels.map((label) => (
                                <div
                                    key={label.id}
                                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                                >
                                    <div className="flex min-w-0 items-center gap-2">
                                        <span
                                            className="h-3 w-3 shrink-0 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    label.color,
                                            }}
                                        />

                                        <span className="truncate text-sm font-medium">
                                            {label.name}
                                        </span>

                                        <span className="text-xs text-muted-foreground">
                                            {label.color}
                                        </span>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() =>
                                                openEdit(
                                                    label
                                                )
                                            }
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-destructive hover:text-destructive"
                                            onClick={() =>
                                                handleDelete(
                                                    label.id
                                                )
                                            }
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Create / edit form */}
                    <div className="border-t pt-4">
                        <div className="mb-3 flex items-center justify-between">
                            <h4 className="text-sm font-medium">
                                {editingLabel
                                    ? "Edit label"
                                    : "Add label"}
                            </h4>

                            {editingLabel && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={resetForm}
                                >
                                    Cancel
                                </Button>
                            )}
                        </div>

                        <div className="space-y-3">
                            <Input
                                value={name}
                                onChange={(e) =>
                                    setName(
                                        e.target.value
                                    )
                                }
                                placeholder="e.g. Backend"
                                maxLength={50}
                            />

                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={color}
                                    onChange={(e) =>
                                        setColor(
                                            e.target.value
                                        )
                                    }
                                    className="h-9 w-12 cursor-pointer rounded-md border"
                                />

                                <Input
                                    value={color}
                                    onChange={(e) =>
                                        setColor(
                                            e.target.value
                                        )
                                    }
                                    placeholder="#3B82F6"
                                />

                                <Button
                                    onClick={
                                        editingLabel
                                            ? handleUpdate
                                            : handleCreate
                                    }
                                    disabled={!name.trim()}
                                >
                                    {editingLabel ? (
                                        "Save"
                                    ) : (
                                        <>
                                            <Plus className="mr-1.5 h-4 w-4" />
                                            Add
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}