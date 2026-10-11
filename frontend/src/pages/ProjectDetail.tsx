import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Circle,
    Columns3,
    Flag,
    FolderKanban,
    ListTodo,
    Loader2,
    Plus,
} from "lucide-react";

import { getProject, type Project } from "@/api/project.api";
import { getBoard, getWorkspaceBoards, type Board } from "@/api/board.api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProjectHeader, { type ProjectViewTab } from "@/components/project/ProjectHeader";
import ProjectProgressSummary from "@/components/project/ProjectProgressSummary";
import MilestoneDisplay from "@/components/project/MilestoneDisplay";
import CreateMilestoneDialog from "@/components/project/CreateMilestoneDialog";
import AdaptiveReplanDialog from "@/components/project/AdaptiveReplanDialog";
import BoardView from "@/components/workspace/BoardView";
import CreateBoardDialog from "@/components/workspace/CreateBoardDialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function ProjectDetail() {
    const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>();
    const navigate = useNavigate();

    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Active tab: Overview | Plan | Board
    const [activeTab, setActiveTab] = useState<ProjectViewTab>("overview");

    // Board execution view state
    const [boards, setBoards] = useState<Board[]>([]);
    const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
    const [activeBoard, setActiveBoard] = useState<Board | null>(null);
    const [boardLoading, setBoardLoading] = useState(false);
    const [createBoardOpen, setCreateBoardOpen] = useState(false);

    // Milestone dialog
    const [createMilestoneOpen, setCreateMilestoneOpen] = useState(false);

    // Adaptive Replan dialog
    const [adaptiveReplanOpen, setAdaptiveReplanOpen] = useState(false);

    const loadProject = useCallback(async () => {
        if (!projectId) return;

        try {
            setLoading(true);
            setError("");
            const data = await getProject(projectId);
            setProject(data);

            // Fetch boards for the project's workspace
            if (data.workspaceId) {
                const wsBoards = await getWorkspaceBoards(data.workspaceId);
                setBoards(wsBoards);
                if (wsBoards.length > 0 && !selectedBoardId) {
                    setSelectedBoardId(wsBoards[0].id);
                }
            }
        } catch (err: any) {
            console.error("Failed to load project:", err);
            setError(
                err.response?.data?.message ??
                err.response?.data?.error?.message ??
                "Unable to load project."
            );
        } finally {
            setLoading(false);
        }
    }, [projectId, selectedBoardId]);

    useEffect(() => {
        loadProject();
    }, [loadProject]);

    // Load full active board when switching board or on initial load
    useEffect(() => {
        if (!selectedBoardId) {
            setActiveBoard(null);
            return;
        }

        let isMounted = true;
        setBoardLoading(true);
        getBoard(selectedBoardId)
            .then((b) => {
                if (isMounted) setActiveBoard(b);
            })
            .catch((err) => console.error("Failed to load board details:", err))
            .finally(() => {
                if (isMounted) setBoardLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [selectedBoardId]);

    const handleBoardCreated = async () => {
        if (project?.workspaceId) {
            const wsBoards = await getWorkspaceBoards(project.workspaceId);
            setBoards(wsBoards);
            if (wsBoards.length > 0) {
                setSelectedBoardId(wsBoards[wsBoards.length - 1].id);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground animate-pulse">Loading project workspace...</p>
                </div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
                <div className="mx-auto max-w-md text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                        <ArrowLeft className="h-6 w-6" />
                    </div>
                    <h1 className="text-xl font-bold">Unable to load project</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {error || "This project could not be found or you don't have access to it."}
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

    const tasks = project.tasks ?? [];

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Project Header with breadcrumbs, title, stats, and tab switcher */}
            <ProjectHeader
                project={project}
                workspaceId={workspaceId!}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onAddMilestoneClick={() => setCreateMilestoneOpen(true)}
                onAdaptiveReplanClick={() => setAdaptiveReplanOpen(true)}
            />

            {/* Main Tab Content */}
            <main className="flex-1">
                {/* 1. OVERVIEW TAB */}
                {activeTab === "overview" && (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                        {/* Progress Summary Component */}
                        <ProjectProgressSummary project={project} />

                        <div className="grid gap-6 lg:grid-cols-3">
                            {/* Roadmap / Milestones Preview Card */}
                            <Card className="lg:col-span-1 shadow-xs">
                                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        <Flag className="h-4 w-4 text-primary" />
                                        Roadmap Milestones
                                    </CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setActiveTab("plan")}
                                        className="text-xs h-7 px-2 text-primary"
                                    >
                                        View Plan →
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {project.milestones.length === 0 ? (
                                        <div className="text-center py-6 text-muted-foreground text-xs">
                                            <p>No milestones created yet.</p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCreateMilestoneOpen(true)}
                                                className="mt-3 text-xs"
                                            >
                                                <Plus className="mr-1 h-3.5 w-3.5" />
                                                Add First Milestone
                                            </Button>
                                        </div>
                                    ) : (
                                        project.milestones.map((m, idx) => {
                                            const mTasks = m.tasks ?? [];
                                            const mDone = mTasks.filter((t) => t.completed).length;
                                            const mTotal = mTasks.length;
                                            const mProgress = mTotal > 0 ? Math.round((mDone / mTotal) * 100) : 0;

                                            return (
                                                <div
                                                    key={m.id}
                                                    onClick={() => setActiveTab("plan")}
                                                    className="p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer space-y-2"
                                                >
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="font-semibold text-foreground truncate max-w-[180px]">
                                                            M{idx + 1}: {m.title}
                                                        </span>
                                                        <span className="text-[11px] font-medium text-muted-foreground">
                                                            {mDone}/{mTotal} done
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                                        <div
                                                            className="h-full bg-primary transition-all duration-300"
                                                            style={{ width: `${mProgress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </CardContent>
                            </Card>

                            {/* Project Tasks Execution Snapshot */}
                            <Card className="lg:col-span-2 shadow-xs">
                                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        <ListTodo className="h-4 w-4 text-primary" />
                                        Project Deliverables & Tasks ({tasks.length})
                                    </CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setActiveTab("board")}
                                        className="text-xs h-7 px-2 text-primary"
                                    >
                                        Open Execution Board →
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    {tasks.length === 0 ? (
                                        <div className="text-center py-10 text-muted-foreground text-xs space-y-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted mx-auto text-muted-foreground">
                                                <ListTodo className="h-5 w-5" />
                                            </div>
                                            <p>No tasks associated with this project yet.</p>
                                            <p className="max-w-xs mx-auto text-[11px]">
                                                Use the execution board to create and assign tasks to this project.
                                            </p>
                                            <Button
                                                size="sm"
                                                onClick={() => setActiveTab("board")}
                                                className="shadow-xs text-xs"
                                            >
                                                <Columns3 className="mr-1.5 h-3.5 w-3.5" />
                                                Go to Execution Board
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-border/40">
                                            {tasks.slice(0, 8).map((task) => (
                                                <div
                                                    key={task.id}
                                                    className="flex items-center justify-between py-2.5 px-2 hover:bg-muted/30 rounded-lg transition-colors text-xs"
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                        {task.completed ? (
                                                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                                        ) : (
                                                            <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                                                        )}
                                                        <span
                                                            className={`font-medium truncate ${
                                                                task.completed
                                                                    ? "line-through text-muted-foreground"
                                                                    : "text-foreground"
                                                            }`}
                                                        >
                                                            {task.title}
                                                        </span>
                                                        {task.milestone && (
                                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                                                                {task.milestone.title}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2 shrink-0 ml-3 text-[11px] text-muted-foreground">
                                                        {task.list && (
                                                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                                                {task.list.name}
                                                            </Badge>
                                                        )}
                                                        {task.dueDate && (
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                {new Date(task.dueDate).toLocaleDateString(undefined, {
                                                                    month: "short",
                                                                    day: "numeric",
                                                                })}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {tasks.length > 8 && (
                                                <div className="pt-3 text-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setActiveTab("board")}
                                                        className="text-xs text-primary"
                                                    >
                                                        View all {tasks.length} tasks on board →
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* 2. PLAN TAB */}
                {activeTab === "plan" && (
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
                        <MilestoneDisplay
                            projectId={project.id}
                            milestones={project.milestones}
                            onMilestoneChanged={loadProject}
                        />
                    </div>
                )}

                {/* 3. BOARD TAB (Reuse existing Kanban!) */}
                {activeTab === "board" && (
                    <div className="flex flex-col h-full min-h-[calc(100vh-12rem)]">
                        {/* Board Switcher bar if multiple boards in workspace */}
                        {boards.length > 1 && (
                            <div className="flex items-center justify-between px-4 sm:px-6 py-2 border-b bg-muted/20">
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="font-medium text-muted-foreground">Workspace Board:</span>
                                    <Select
                                        value={selectedBoardId || ""}
                                        onValueChange={(val) => setSelectedBoardId(val)}
                                    >
                                        <SelectTrigger className="h-8 text-xs w-[220px]">
                                            <SelectValue placeholder="Select board" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {boards.map((b) => (
                                                <SelectItem key={b.id} value={b.id} className="text-xs">
                                                    {b.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setCreateBoardOpen(true)}
                                    className="h-7 text-xs"
                                >
                                    <Plus className="mr-1 h-3 w-3" />
                                    New Board
                                </Button>
                            </div>
                        )}

                        {boardLoading ? (
                            <div className="flex flex-1 items-center justify-center p-12">
                                <div className="flex flex-col items-center gap-3">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    <p className="text-xs text-muted-foreground animate-pulse">Loading board...</p>
                                </div>
                            </div>
                        ) : activeBoard ? (
                            /* REUSING THE EXISTING KANBAN BOARD SYSTEM */
                            <div className="flex-1">
                                <BoardView
                                    board={activeBoard}
                                    onBack={() => setActiveTab("overview")}
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card p-12 text-center m-6 shadow-xs">
                                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    <FolderKanban className="h-6 w-6" />
                                </div>
                                <h3 className="font-semibold text-base">No Board in this Workspace yet</h3>
                                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                                    Create a Kanban board to execute tasks, drag cards across columns, and track milestones.
                                </p>
                                <Button
                                    onClick={() => setCreateBoardOpen(true)}
                                    className="mt-5 shadow-xs"
                                >
                                    <Plus className="mr-1.5 h-4 w-4" />
                                    Create Board
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Dialogs */}
            <CreateMilestoneDialog
                open={createMilestoneOpen}
                onOpenChange={setCreateMilestoneOpen}
                projectId={project.id}
                onCreated={loadProject}
            />

            <CreateBoardDialog
                open={createBoardOpen}
                onOpenChange={setCreateBoardOpen}
                workspaceId={project.workspaceId}
                onCreated={handleBoardCreated}
            />

            <AdaptiveReplanDialog
                open={adaptiveReplanOpen}
                onOpenChange={setAdaptiveReplanOpen}
                projectId={project.id}
                projectName={project.name}
                onReplanApplied={loadProject}
            />
        </div>
    );
}
