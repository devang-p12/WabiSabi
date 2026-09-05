import { useEffect, useState } from "react";

import type { BoardList } from "@/api/list.api";

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

interface RenameListDialogProps {
    list: BoardList | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onRename: (name: string) => Promise<void>;
}

export default function RenameListDialog({
    list,
    open,
    onOpenChange,
    onRename,
}: RenameListDialogProps) {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (list) {
            setName(list.name);
        }
    }, [list]);

    const handleSubmit = async () => {
        const trimmedName = name.trim();

        if (!trimmedName || !list) {
            return;
        }

        try {
            setLoading(true);

            await onRename(trimmedName);

            onOpenChange(false);
        } catch (error) {
            console.error("Failed to rename list:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >
            <DialogContent className="sm:max-w-md">

                <DialogHeader>
                    <DialogTitle>
                        Rename list
                    </DialogTitle>

                    <DialogDescription>
                        Change the name of this board list.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-2">
                    <Input
                        value={name}
                        onChange={(event) =>
                            setName(event.target.value)
                        }
                        placeholder="List name"
                        autoFocus
                        onKeyDown={(event) => {
                            if (
                                event.key === "Enter" &&
                                !loading
                            ) {
                                handleSubmit();
                            }
                        }}
                    />
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() =>
                            onOpenChange(false)
                        }
                        disabled={loading}
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={handleSubmit}
                        disabled={
                            loading ||
                            !name.trim()
                        }
                    >
                        {loading
                            ? "Saving..."
                            : "Save changes"}
                    </Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
}