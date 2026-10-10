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

import { createProject, type Project } from "@/api/project.api";

interface CreateProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    workspaceId: string;
    onCreated: (project: Project) => void | Promise<void>;
}

export default function CreateProjectDialog({
    open,
    onOpenChange,
    workspaceId,
    onCreated,
}: CreateProjectDialogProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleCreate = async () => {
        if (!name.trim()) {
            setError("Project name is required.");
            return;
        }

        if (name.trim().length < 2) {
            setError("Project name must be at least 2 characters.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const newProject = await createProject(workspaceId, {
                name: name.trim(),
                description: description.trim() || undefined,
            });

            setName("");
            setDescription("");
            onOpenChange(false);

            await onCreated(newProject);
        } catch (err: any) {
            setError(
                err.response?.data?.message ??
                err.response?.data?.error?.message ??
                "Unable to create project."
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
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Create Project</DialogTitle>
                    <DialogDescription>
                        Define a project goal, roadmap milestones, and track execution.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <label
                            htmlFor="project-name"
                            className="text-sm font-medium"
                        >
                            Project Name <span className="text-destructive">*</span>
                        </label>
                        <Input
                            id="project-name"
                            placeholder="e.g. Q4 Website Redesign"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setError("");
                            }}
                            disabled={loading}
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="project-description"
                            className="text-sm font-medium"
                        >
                            Description
                            <span className="ml-1 text-muted-foreground text-xs">
                                (optional)
                            </span>
                        </label>
                        <Textarea
                            id="project-description"
                            placeholder="What is this project about, and what are the main deliverables?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
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
                        {loading ? "Creating..." : "Create Project"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
