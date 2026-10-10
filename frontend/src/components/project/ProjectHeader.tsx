import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Briefcase,
    Columns3,
    Flag,
    LayoutDashboard,
    Plus,
} from "lucide-react";

import { type Project } from "@/api/project.api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ProjectViewTab = "overview" | "plan" | "board";

interface ProjectHeaderProps {
    project: Project;
    workspaceId: string;
    activeTab: ProjectViewTab;
    onTabChange: (tab: ProjectViewTab) => void;
    onAddMilestoneClick?: () => void;
}

export default function ProjectHeader({
    project,
    workspaceId,
    activeTab,
    onTabChange,
    onAddMilestoneClick,
}: ProjectHeaderProps) {
    const navigate = useNavigate();

    const progress = project.progressPercentage ?? 0;
    const milestoneCount = project.milestones?.length ?? project._count?.milestones ?? 0;
    const taskCount = project.totalTasks ?? project.tasks?.length ?? project._count?.tasks ?? 0;

    return (
        <header className="border-b bg-background">
            <div className="px-4 sm:px-6 pt-4 pb-2 space-y-4 max-w-7xl mx-auto">
                {/* Top bar with back button & breadcrumbs */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/workspaces/${workspaceId}`)}
                            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                            Back to Workspace
                        </Button>

                        <span className="text-muted-foreground text-xs">/</span>
                        <span className="text-xs font-medium text-muted-foreground">Projects</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {onAddMilestoneClick && activeTab === "plan" && (
                            <Button
                                size="sm"
                                onClick={onAddMilestoneClick}
                                className="h-8 text-xs shadow-xs"
                            >
                                <Plus className="mr-1.5 h-3.5 w-3.5" />
                                Add Milestone
                            </Button>
                        )}
                    </div>
                </div>

                {/* Project Title, Description & Stats Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
                    <div className="flex items-start gap-3.5 min-w-0">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                            <Briefcase className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
                                    {project.name}
                                </h1>
                                <Badge variant="secondary" className="text-xs">
                                    {progress}% Complete
                                </Badge>
                            </div>
                            <p className="mt-1 text-xs sm:text-sm text-muted-foreground line-clamp-2 max-w-3xl">
                                {project.description || "Project execution workspace with milestones, progress tracking, and execution board."}
                            </p>
                        </div>
                    </div>

                    {/* Quick Stats Pill */}
                    <div className="flex items-center gap-4 self-start md:self-center bg-muted/40 px-3.5 py-2 rounded-xl border text-xs text-muted-foreground">
                        <div className="text-center">
                            <div className="font-bold text-foreground text-sm">{milestoneCount}</div>
                            <div className="text-[10px]">Milestones</div>
                        </div>
                        <div className="h-6 w-px bg-border" />
                        <div className="text-center">
                            <div className="font-bold text-foreground text-sm">{taskCount}</div>
                            <div className="text-[10px]">Tasks</div>
                        </div>
                        <div className="h-6 w-px bg-border" />
                        <div className="text-center">
                            <div className="font-bold text-primary text-sm">{progress}%</div>
                            <div className="text-[10px]">Progress</div>
                        </div>
                    </div>
                </div>

                {/* Segmented Tab Navigation: Overview, Plan, Board */}
                <div className="flex items-center gap-2 pt-2 border-t overflow-x-auto">
                    <button
                        type="button"
                        onClick={() => onTabChange("overview")}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap",
                            activeTab === "overview"
                                ? "bg-primary text-primary-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                    >
                        <LayoutDashboard className="h-3.5 w-3.5" />
                        Overview
                    </button>

                    <button
                        type="button"
                        onClick={() => onTabChange("plan")}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap",
                            activeTab === "plan"
                                ? "bg-primary text-primary-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                    >
                        <Flag className="h-3.5 w-3.5" />
                        Plan
                        <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-4">
                            {milestoneCount}
                        </Badge>
                    </button>

                    <button
                        type="button"
                        onClick={() => onTabChange("board")}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap",
                            activeTab === "board"
                                ? "bg-primary text-primary-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                    >
                        <Columns3 className="h-3.5 w-3.5" />
                        Board
                    </button>
                </div>
            </div>
        </header>
    );
}
