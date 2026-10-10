import { useNavigate } from "react-router-dom";
import {
    Briefcase,
    CheckCircle2,
    Flag,
    MoreHorizontal,
    Trash2,
    ArrowRight,
    Calendar,
} from "lucide-react";

import { type Project, deleteProject } from "@/api/project.api";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface ProjectCardProps {
    project: Project;
    workspaceId: string;
    onDeleted?: (projectId: string) => void;
}

export default function ProjectCard({
    project,
    workspaceId,
    onDeleted,
}: ProjectCardProps) {
    const navigate = useNavigate();

    const handleOpen = () => {
        navigate(`/workspaces/${workspaceId}/projects/${project.id}`);
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
            try {
                await deleteProject(project.id);
                onDeleted?.(project.id);
            } catch (err) {
                console.error("Failed to delete project:", err);
            }
        }
    };

    const milestoneCount = project.milestones?.length ?? project._count?.milestones ?? 0;
    const totalTasks = project.totalTasks ?? project.tasks?.length ?? project._count?.tasks ?? 0;
    const completedTasks = project.completedTasks ?? 0;
    const progress = project.progressPercentage ?? 0;

    const formattedDate = new Date(project.updatedAt || project.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
    });

    return (
        <div
            onClick={handleOpen}
            className="group relative flex flex-col justify-between rounded-xl border bg-card p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-md cursor-pointer"
        >
            <div>
                {/* Header: Icon, Title, and Menu */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                            <Briefcase className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-semibold text-base tracking-tight truncate group-hover:text-primary transition-colors">
                                {project.name}
                            </h3>
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                                <Calendar className="h-3 w-3" />
                                <span>Updated {formattedDate}</span>
                            </div>
                        </div>
                    </div>

                    <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground opacity-60 group-hover:opacity-100 hover:text-foreground"
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={handleOpen}>
                                    Open Project
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={handleDelete}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Project
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Description */}
                <p className="mt-3 line-clamp-2 text-xs text-muted-foreground leading-relaxed min-h-[2.5rem]">
                    {project.description || "No description provided for this project."}
                </p>
            </div>

            <div className="mt-5 space-y-3 pt-3 border-t border-border/50">
                {/* Progress Bar and Indicator */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-muted-foreground">Progress</span>
                        <span className="font-semibold text-primary">{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                        />
                    </div>
                </div>

                {/* Footer Metadata */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[11px]">
                            <Flag className="h-3 w-3 text-primary/70" />
                            <span>{milestoneCount} {milestoneCount === 1 ? "milestone" : "milestones"}</span>
                        </span>
                        <span className="flex items-center gap-1 text-[11px]">
                            <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
                            <span>{completedTasks}/{totalTasks} tasks</span>
                        </span>
                    </div>

                    <span className="flex items-center gap-0.5 text-[11px] font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Workspace</span>
                        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                </div>
            </div>
        </div>
    );
}
