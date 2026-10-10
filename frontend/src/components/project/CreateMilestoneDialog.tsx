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
import { Button } from "@/components/ui/button";

import { createMilestone, type Milestone } from "@/api/project.api";

interface CreateMilestoneDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: string;
    onCreated: (milestone: Milestone) => void | Promise<void>;
}

export default function CreateMilestoneDialog({
    open,
    onOpenChange,
    projectId,
    onCreated,
}: CreateMilestoneDialogProps) {
    const [title, setTitle] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleCreate = async () => {
        if (!title.trim()) {
            setError("Milestone title is required.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const newMilestone = await createMilestone(projectId, {
                title: title.trim(),
            });

            setTitle("");
            onOpenChange(false);

            await onCreated(newMilestone);
        } catch (err: any) {
            setError(
                err.response?.data?.message ??
                err.response?.data?.error?.message ??
                "Unable to create milestone."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChange = (value: boolean) => {
        if (loading) return;

        if (!value) {
            setTitle("");
            setError("");
        }

        onOpenChange(value);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                    <DialogTitle>Add Milestone</DialogTitle>
                    <DialogDescription>
                        Create a milestone or phase for this project roadmap.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <label
                            htmlFor="milestone-title"
                            className="text-sm font-medium"
                        >
                            Milestone Title <span className="text-destructive">*</span>
                        </label>
                        <Input
                            id="milestone-title"
                            placeholder="e.g. Phase 1: MVP Architecture"
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value);
                                setError("");
                            }}
                            disabled={loading}
                            autoFocus
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
                        {loading ? "Adding..." : "Add Milestone"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
