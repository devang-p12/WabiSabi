import { useState } from "react";
import { Loader2, Plus } from "lucide-react";

import {
    createWorkspace,
} from "@/api/workspace.api";

import { Button } from "@/components/ui/button";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CreateWorkspaceDialogProps {
    onCreated: () => void;
}

export function CreateWorkspaceDialog({
    onCreated,
}: CreateWorkspaceDialogProps) {
    const [open, setOpen] = useState(false);

    const [name, setName] = useState("");
    const [description, setDescription] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            await createWorkspace({
                name,
                description: description || undefined,
            });

            setName("");
            setDescription("");

            setOpen(false);
            onCreated();
        } catch (error: any) {
            setError(
                error.response?.data?.error?.message ??
                    "Unable to create workspace."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={setOpen}
        >
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New workspace
                </Button>
            </DialogTrigger>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Create workspace
                    </DialogTitle>

                    <DialogDescription>
                        Create a workspace to organize
                        your work and collaborate with
                        your team.
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-5"
                >
                    <div className="space-y-2">
                        <Label htmlFor="workspace-name">
                            Name
                        </Label>

                        <Input
                            id="workspace-name"
                            placeholder="e.g. Wabi Development"
                            value={name}
                            onChange={(event) =>
                                setName(
                                    event.target.value
                                )
                            }
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="workspace-description">
                            Description
                        </Label>

                        <Textarea
                            id="workspace-description"
                            placeholder="What is this workspace for?"
                            value={description}
                            onChange={(event) =>
                                setDescription(
                                    event.target.value
                                )
                            }
                            disabled={loading}
                        />
                    </div>

                    {error && (
                        <div
                            role="alert"
                            className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                        >
                            {error}
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create workspace"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}