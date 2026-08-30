import { Loader2 } from "lucide-react";

import type { Workspace } from "@/api/workspace.api";

import { WorkspaceCard } from "./WorkspaceCard";

interface WorkspaceListProps {
    workspaces: Workspace[];
    loading: boolean;
}

export function WorkspaceList({
    workspaces,
    loading,
}: WorkspaceListProps) {
    if (loading) {
        return (
            <div className="flex min-h-48 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (workspaces.length === 0) {
        return (
            <div className="rounded-xl border border-dashed p-10 text-center">
                <h3 className="font-semibold">
                    No workspaces yet
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                    Create your first workspace to get
                    started.
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((workspace) => (
                <WorkspaceCard
                    key={workspace.id}
                    workspace={workspace}
                />
            ))}
        </div>
    );
}