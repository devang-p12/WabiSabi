import { Link } from "react-router-dom";
import { FolderKanban, ArrowRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import type { Workspace } from "@/api/workspace.api";

interface WorkspaceCardProps {
    workspace: Workspace;
}

export function WorkspaceCard({
    workspace,
}: WorkspaceCardProps) {
    return (
        <Card className="group transition-all hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <FolderKanban className="h-5 w-5 text-primary" />
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        asChild
                    >
                        <Link
                            to={`/workspaces/${workspace.id}`}
                        >
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>

                <div className="mt-4">
                    <h3 className="font-semibold">
                        {workspace.name}
                    </h3>

                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {workspace.description ||
                            "No description"}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}