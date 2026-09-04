import { useState } from "react";
import { Loader2, Mail, UserPlus } from "lucide-react";

import { addWorkspaceMember } from "@/api/workspace.api";

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface AddMemberDialogProps {
    workspaceId: string;
    onAdded: () => void | Promise<void>;
}

export default function AddMemberDialog({
    workspaceId,
    onAdded,
}: AddMemberDialogProps) {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!email.trim()) {
            setError("Email is required.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            await addWorkspaceMember(workspaceId, {
                email: email.trim(),
                role,
            });

            setEmail("");
            setRole("MEMBER");
            setOpen(false);

            await onAdded();
        } catch (error: any) {
            setError(
                error.response?.data?.error?.message ??
                    "Unable to add member."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChange = (value: boolean) => {
        setOpen(value);

        if (!value) {
            setEmail("");
            setRole("MEMBER");
            setError("");
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add member
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Add workspace member</DialogTitle>

                        <DialogDescription>
                            Invite an existing Wabi user to this workspace.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 py-6">
                        <div className="space-y-2">
                            <Label htmlFor="member-email">
                                Email address
                            </Label>

                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                                <Input
                                    id="member-email"
                                    type="email"
                                    placeholder="alice@example.com"
                                    value={email}
                                    onChange={(event) =>
                                        setEmail(event.target.value)
                                    }
                                    className="pl-9"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Role</Label>

                            <Select
                                value={role}
                                onValueChange={(value) =>
                                    setRole(
                                        value as "ADMIN" | "MEMBER"
                                    )
                                }
                                disabled={loading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="MEMBER">
                                        Member
                                    </SelectItem>

                                    <SelectItem value="ADMIN">
                                        Admin
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {error && (
                            <p className="text-sm text-destructive">
                                {error}
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>

                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Add member
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}