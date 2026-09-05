import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

interface BoardEmptyStateProps {
    onCreateList: () => void;
}

export default function BoardEmptyState({
    onCreateList,
}: BoardEmptyStateProps) {
    return (
        <div className="flex w-full flex-col items-center justify-center">
            <div className="rounded-xl border border-dashed px-8 py-10 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Plus className="h-5 w-5 text-muted-foreground" />
                </div>

                <h2 className="text-sm font-semibold">
                    No lists yet
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                    Create your first list to start organizing work.
                </p>

                <Button
                    size="sm"
                    className="mt-4"
                    onClick={onCreateList}
                >
                    <Plus className="mr-1.5 h-4 w-4" />
                    Create list
                </Button>
            </div>
        </div>
    );
}