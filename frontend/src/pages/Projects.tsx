import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Briefcase,
    Loader2,
    Plus,
    Search,
} from "lucide-react";

import {
    getWorkspaceProjects,
    type Project,
} from "@/api/project.api";
import { getWorkspace, type Workspace } from "@/api/workspace.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import ProjectCard from "@/components/project/ProjectCard";
import CreateProjectDialog from "@/components/project/CreateProjectDialog";
import NotificationBell from "@/components/notifications/NotificationBell";
import CommandTriggerButton from "@/components/command/CommandTriggerButton";

export default function Projects() {
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const navigate = useNavigate();

    const [workspace, setWorkspace] = useState<Workspace | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    const loadData = useCallback(async () => {
        if (!workspaceId) return;

        try {
            setLoading(true);
            setError("");

            const [wsData, projData] = await Promise.all([
                getWorkspace(workspaceId),
                getWorkspaceProjects(workspaceId),
            ]);

            setWorkspace(wsData);
            setProjects(projData);
        } catch (err: any) {
            console.error("Failed to load projects:", err);
            setError(
                err.response?.data?.message ??
                err.response?.data?.error?.message ??
                "Unable to load projects."
            );
        } finally {
            setLoading(false);
        }
    }, [workspaceId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredProjects = projects.filter((p) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            p.name.toLowerCase().includes(q) ||
            (p.description && p.description.toLowerCase().includes(q))
        );
    });

    const handleProjectCreated = (newProject: Project) => {
        setProjects((prev) => [newProject, ...prev]);
    };

    const handleProjectDeleted = (deletedId: string) => {
        setProjects((prev) => prev.filter((p) => p.id !== deletedId));
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground animate-pulse">Loading projects...</p>
                </div>
            </div>
        );
    }

    if (error || !workspace) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
                <div className="mx-auto max-w-md text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                        <ArrowLeft className="h-6 w-6" />
                    </div>
                    <h1 className="text-xl font-bold">Unable to load projects</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {error || "This workspace could not be found or you don't have access."}
                    </p>
                    <Button
                        className="mt-6 shadow-xs"
                        onClick={() => navigate(`/workspaces/${workspaceId}`)}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to workspace
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Top Workspace Bar */}
            <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur-sm">
                <div className="flex h-14 items-center justify-between px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/workspaces/${workspaceId}`)}
                            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                            {workspace.name}
                        </Button>
                        <span className="text-muted-foreground text-xs">/</span>
                        <span className="text-xs font-semibold text-foreground">Projects</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <CommandTriggerButton />
                        <NotificationBell />
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
                            <Badge variant="secondary" className="text-xs">
                                {projects.length}
                            </Badge>
                        </div>
                        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                            Define project workspaces, coordinate roadmap milestones, and track execution.
                        </p>
                    </div>

                    <Button
                        onClick={() => setCreateDialogOpen(true)}
                        className="shadow-xs self-start sm:self-center"
                    >
                        <Plus className="mr-1.5 h-4 w-4" />
                        New Project
                    </Button>
                </div>

                {/* Filter and Search Bar */}
                {projects.length > 0 && (
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search projects by name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9 text-xs"
                            />
                        </div>
                    </div>
                )}

                {/* Projects Grid or Empty State */}
                {projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card p-12 text-center shadow-xs">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Briefcase className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold text-base">No projects created yet</h3>
                        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                            Projects help you organize high-level deliverables, track progress milestones, and align execution across your team.
                        </p>
                        <Button
                            onClick={() => setCreateDialogOpen(true)}
                            className="mt-5 shadow-xs"
                        >
                            <Plus className="mr-1.5 h-4 w-4" />
                            Create your first project
                        </Button>
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-sm">
                        No projects matching "{searchQuery}".
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                        {filteredProjects.map((project) => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                workspaceId={workspaceId!}
                                onDeleted={handleProjectDeleted}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Create Project Modal */}
            <CreateProjectDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                workspaceId={workspaceId!}
                onCreated={handleProjectCreated}
            />
        </div>
    );
}
