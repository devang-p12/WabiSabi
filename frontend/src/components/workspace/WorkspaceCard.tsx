import { Link } from "react-router-dom";
import { FolderKanban, ArrowRight, Layers } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";


import type { Workspace } from "@/api/workspace.api";

interface WorkspaceCardProps {
    workspace: Workspace;
    onClick?: () => void;
}

export function WorkspaceCard({
    workspace,
    onClick,
}: WorkspaceCardProps) {
    return (
        <Link
            to={`/workspaces/${workspace.id}`}
            onClick={onClick}
            className="block text-inherit no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
        >
            <Card className="group relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-primary/40 bg-card/80 backdrop-blur-xs">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/80 via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                            <FolderKanban className="h-5 w-5" />
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground group-hover:text-primary transition-colors font-medium">
                            <span>Open</span>
                            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-base tracking-tight truncate group-hover:text-primary transition-colors">
                                {workspace.name}
                            </h3>
                        </div>

                        <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                            {workspace.description || "Click to open boards, manage tasks, and collaborate with members."}
                        </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Layers className="h-3.5 w-3.5" />
                            <span>Workspace</span>
                        </span>
                        <span className="text-[11px] font-medium text-primary/80 group-hover:underline">
                            View boards →
                        </span>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}