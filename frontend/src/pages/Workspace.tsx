import { useCallback, useEffect, useState } from "react";
import {
    ArrowLeft,
    ArrowRight,
    Columns3,
    FolderKanban,
    LayoutDashboard,
    Loader2,
    MoreHorizontal,
    Plus,
    Shield,
    Sparkles,
    UserMinus,
    UserRound,
    Users,
} from "lucide-react";
import {
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    getWorkspace,
    getWorkspaceMembers,
    removeWorkspaceMember,
    updateWorkspaceMember,
    type Workspace as WorkspaceType,
    type WorkspaceMember,
} from "@/api/workspace.api";

import { Button } from "@/components/ui/button";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";

import {
    Avatar,
    AvatarFallback,
} from "@/components/ui/avatar";

import {
    Badge,
} from "@/components/ui/badge";
import AddMemberDialog from "@/components/workspace/AddMemberDialog";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
import {
    getWorkspaceBoards,
    type Board,
} from "@/api/board.api";
import CreateBoardDialog from "@/components/workspace/CreateBoardDialog";
import BoardView from "@/components/workspace/BoardView";

import { useAuth } from "@/context/AuthContext";

export default function Workspace() {
    const { user } = useAuth();
    const { workspaceId } = useParams();
    const navigate = useNavigate();

    const [workspace, setWorkspace] = useState<WorkspaceType | null>(null);
    const [members, setMembers] = useState<WorkspaceMember[]>([]);
    const [loading, setLoading] = useState(true);

    const [boards, setBoards] = useState<Board[]>([]);
    const [boardsLoading, setBoardsLoading] = useState(true);
    const [createBoardOpen, setCreateBoardOpen] = useState(false);

    const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [dismissGuide, setDismissGuide] = useState(false);

    const [error, setError] = useState("");

    const loadBoards = async () => {
        if (!workspaceId) return;

        try {
            setBoardsLoading(true);
            const data = await getWorkspaceBoards(workspaceId);
            setBoards(data);
        } catch (err) {
            console.error("Failed to load boards:", err);
        } finally {
            setBoardsLoading(false);
        }
    };

    const loadWorkspace = useCallback(async () => {
        if (!workspaceId) return;

        try {
            setLoading(true);
            setError("");

            const [workspaceData, membersData] = await Promise.all([
                getWorkspace(workspaceId),
                getWorkspaceMembers(workspaceId),
            ]);

            setWorkspace(workspaceData);
            setMembers(membersData);
        } catch (err: any) {
            setError(
                err.response?.data?.error?.message ?? "Unable to load workspace."
            );
        } finally {
            setLoading(false);
        }
    }, [workspaceId]);

    useEffect(() => {
        if (!workspaceId) return;

        loadWorkspace();
        loadBoards();
    }, [workspaceId, loadWorkspace]);

    const handleChangeRole = async (
        userId: string,
        role: "ADMIN" | "MEMBER"
    ) => {
        if (!workspaceId) return;

        try {
            setError("");
            await updateWorkspaceMember(workspaceId, userId, role);
            await loadWorkspace();
        } catch (err: any) {
            setError(
                err.response?.data?.error?.message ?? "Unable to update member role."
            );
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!workspaceId) return;

        const confirmed = window.confirm(
            "Are you sure you want to remove this member?"
        );
        if (!confirmed) return;

        try {
            setError("");
            await removeWorkspaceMember(workspaceId, userId);
            await loadWorkspace();
        } catch (err: any) {
            setError(
                err.response?.data?.error?.message ?? "Unable to remove member."
            );
        }
    };

    const currentMembership = members.find(
        (member) => member.userId === user?.id
    );
    const currentUserRole = currentMembership?.role;

    const getInitials = (name: string) =>
        name
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground animate-pulse">Loading workspace...</p>
                </div>
            </div>
        );
    }

    if (error || !workspace) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
                <div className="max-w-md text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                        <ArrowLeft className="h-6 w-6" />
                    </div>
                    <h1 className="text-xl font-bold">
                        Unable to load workspace
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {error || "Workspace not found or you don't have access to it."}
                    </p>
                    <Button
                        className="mt-6"
                        variant="outline"
                        onClick={() => navigate("/dashboard")}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to dashboard
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/20">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur-xs">
                <div className="flex h-16 items-center justify-between px-4 sm:px-6">
                    <div className="flex items-center gap-3 min-w-0">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate("/dashboard")}
                            className="text-muted-foreground hover:text-foreground shrink-0"
                        >
                            <ArrowLeft className="mr-1.5 h-4 w-4" />
                            <span className="hidden sm:inline">Dashboard</span>
                        </Button>

                        <div className="h-4 w-px bg-border shrink-0" />

                        {/* Breadcrumbs */}
                        <div className="flex items-center gap-2 min-w-0 text-sm">
                            <span className="font-semibold truncate">
                                {workspace.name}
                            </span>
                            {currentUserRole && (
                                <Badge variant="outline" className="hidden sm:inline-flex text-[11px] py-0 px-2">
                                    {currentUserRole.toLowerCase()}
                                </Badge>
                            )}
                            {selectedBoard && (
                                <>
                                    <span className="text-muted-foreground">/</span>
                                    <span className="font-medium text-primary truncate">
                                        {selectedBoard.name}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {selectedBoard ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedBoard(null)}
                                className="text-xs"
                            >
                                <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" />
                                Workspace Overview
                            </Button>
                        ) : (
                            (currentUserRole === "OWNER" || currentUserRole === "ADMIN") && (
                                <Button
                                    size="sm"
                                    onClick={() => setCreateBoardOpen(true)}
                                    className="text-xs shadow-xs"
                                >
                                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                                    New Board
                                </Button>
                            )
                        )}
                    </div>
                </div>
            </header>

            {/* Layout */}
            <div className="flex min-h-[calc(100vh-4rem)] w-full">
                {/* Sidebar */}
                <WorkspaceSidebar
                    workspace={workspace}
                    boards={boards}
                    selectedBoardId={selectedBoard?.id ?? null}
                    canCreateBoard={
                        currentUserRole === "OWNER" ||
                        currentUserRole === "ADMIN"
                    }
                    collapsed={sidebarCollapsed}
                    onSelectHome={() => setSelectedBoard(null)}
                    onSelectBoard={(board) => setSelectedBoard(board)}
                    onCreateBoard={() => setCreateBoardOpen(true)}
                    onToggleCollapse={() =>
                        setSidebarCollapsed((value) => !value)
                    }
                />

                {/* Main Content Area */}
                <main className="min-w-0 flex-1">
                    {selectedBoard ? (
                        <div className="h-[calc(100vh-4rem)] overflow-hidden">
                            <BoardView
                                board={selectedBoard}
                                onBack={() => setSelectedBoard(null)}
                            />
                        </div>
                    ) : (
                        <div className="mx-auto max-w-6xl p-6 lg:p-8 space-y-8 overflow-y-auto">
                            {/* Workspace Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2.5">
                                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                                            {workspace.name}
                                        </h1>
                                        {currentUserRole && (
                                            <Badge variant="secondary" className="capitalize text-xs">
                                                {currentUserRole.toLowerCase()}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {workspace.description || "Manage your boards, organize tasks, and collaborate with your team."}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    {(currentUserRole === "OWNER" || currentUserRole === "ADMIN") && (
                                        <>
                                            <AddMemberDialog
                                                workspaceId={workspace.id}
                                                onAdded={loadWorkspace}
                                            />
                                            <Button
                                                onClick={() => setCreateBoardOpen(true)}
                                                className="shadow-xs"
                                            >
                                                <Plus className="mr-1.5 h-4 w-4" />
                                                Create Board
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* First-Time User Onboarding Guide Banner */}
                            {!dismissGuide && (
                                <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent p-5 sm:p-6 shadow-xs">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                                                <Sparkles className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-base">
                                                    Welcome to your workspace!
                                                </h3>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    Here is how you can get started in 4 simple steps:
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setDismissGuide(true)}
                                            className="text-xs text-muted-foreground hover:text-foreground"
                                        >
                                            Dismiss
                                        </button>
                                    </div>

                                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-2">
                                        <div className="rounded-xl bg-background/80 p-3.5 border shadow-2xs backdrop-blur-xs">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[11px]">1</span>
                                                Create a Board
                                            </div>
                                            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                                                Set up a board for each project, sprint, or workflow.
                                            </p>
                                        </div>

                                        <div className="rounded-xl bg-background/80 p-3.5 border shadow-2xs backdrop-blur-xs">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[11px]">2</span>
                                                Set Up Columns
                                            </div>
                                            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                                                Add stages like To Do, In Progress, Review, and Done.
                                            </p>
                                        </div>

                                        <div className="rounded-xl bg-background/80 p-3.5 border shadow-2xs backdrop-blur-xs">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[11px]">3</span>
                                                Add & Drag Tasks
                                            </div>
                                            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                                                Add cards with priorities, tags, and deadlines. Drag to move.
                                            </p>
                                        </div>

                                        <div className="rounded-xl bg-background/80 p-3.5 border shadow-2xs backdrop-blur-xs">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[11px]">4</span>
                                                Collaborate
                                            </div>
                                            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                                                Invite teammates, post task comments, and check activity logs.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Workspace Quick Stats */}
                            <div className="grid gap-4 sm:grid-cols-3">
                                <Card className="hover:shadow-xs transition-shadow">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                                            <span>Boards</span>
                                            <FolderKanban className="h-4 w-4 text-primary" />
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {boardsLoading ? (
                                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                            ) : (
                                                boards.length
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {boards.length === 1 ? "Active board" : "Active boards"}
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="hover:shadow-xs transition-shadow">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                                            <span>Team Members</span>
                                            <Users className="h-4 w-4 text-primary" />
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {members.length}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            People collaborating here
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="hover:shadow-xs transition-shadow">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                                            <span>Your Role</span>
                                            <Shield className="h-4 w-4 text-primary" />
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold capitalize">
                                            {currentUserRole?.toLowerCase() || "Member"}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {currentUserRole === "OWNER" ? "Full administrative access" : currentUserRole === "ADMIN" ? "Can manage boards & members" : "Can view and edit tasks"}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* ───────────────── Boards Section ───────────────── */}
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-semibold tracking-tight">
                                            Boards
                                        </h2>
                                        {!boardsLoading && (
                                            <Badge variant="secondary" className="text-xs">
                                                {boards.length}
                                            </Badge>
                                        )}
                                    </div>

                                    {(currentUserRole === "OWNER" || currentUserRole === "ADMIN") && boards.length > 0 && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setCreateBoardOpen(true)}
                                            className="text-xs"
                                        >
                                            <Plus className="mr-1.5 h-3.5 w-3.5" />
                                            Add Board
                                        </Button>
                                    )}
                                </div>

                                {boardsLoading ? (
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {[1, 2, 3].map((n) => (
                                            <div
                                                key={n}
                                                className="h-36 rounded-xl border border-dashed border-border/80 bg-muted/30 p-5 animate-pulse"
                                            />
                                        ))}
                                    </div>
                                ) : boards.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card p-10 text-center shadow-xs">
                                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                            <FolderKanban className="h-6 w-6" />
                                        </div>
                                        <h3 className="text-base font-semibold">
                                            No boards yet
                                        </h3>
                                        <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                                            Boards are visual workspaces where you organize tasks into columns like To Do, In Progress, and Completed.
                                        </p>
                                        {(currentUserRole === "OWNER" || currentUserRole === "ADMIN") && (
                                            <Button
                                                onClick={() => setCreateBoardOpen(true)}
                                                className="mt-5 shadow-xs"
                                                size="sm"
                                            >
                                                <Plus className="mr-1.5 h-4 w-4" />
                                                Create Your First Board
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {boards.map((b) => (
                                            <div
                                                key={b.id}
                                                onClick={() => setSelectedBoard(b)}
                                                className="group cursor-pointer rounded-xl border bg-card p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-md"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                                                        <FolderKanban className="h-5 w-5" />
                                                    </div>

                                                    <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
                                                        <span>Open</span>
                                                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                                                    </span>
                                                </div>

                                                <div className="mt-4">
                                                    <h3 className="font-semibold text-base tracking-tight truncate group-hover:text-primary transition-colors">
                                                        {b.name}
                                                    </h3>
                                                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                                                        {b.description || "Click to open columns, tasks, and view board activity."}
                                                    </p>
                                                </div>

                                                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1 text-[11px]">
                                                        <Columns3 className="h-3 w-3" />
                                                        <span>Kanban Board</span>
                                                    </span>
                                                    <span className="text-[11px] text-primary/80 font-medium group-hover:underline">
                                                        View board →
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* ───────────────── Members Section ───────────────── */}
                            <section className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-base font-semibold">
                                                    Members ({members.length})
                                                </CardTitle>
                                                <CardDescription className="text-xs mt-0.5">
                                                    People who have access to collaborate in this workspace.
                                                </CardDescription>
                                            </div>

                                            {(currentUserRole === "OWNER" || currentUserRole === "ADMIN") && (
                                                <AddMemberDialog
                                                    workspaceId={workspace.id}
                                                    onAdded={loadWorkspace}
                                                />
                                            )}
                                        </div>
                                    </CardHeader>

                                    <CardContent>
                                        {members.length === 0 ? (
                                            <div className="flex min-h-24 flex-col items-center justify-center text-center">
                                                <Users className="mb-2 h-6 w-6 text-muted-foreground" />
                                                <p className="text-sm font-medium">No members yet</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y border-t">
                                                {members.map((member) => (
                                                    <div
                                                        key={member.userId}
                                                        className="flex items-center justify-between py-3.5"
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <Avatar className="h-9 w-9">
                                                                <AvatarFallback className="text-xs font-semibold">
                                                                    {getInitials(member.user.name)}
                                                                </AvatarFallback>
                                                            </Avatar>

                                                            <div className="min-w-0">
                                                                <p className="text-sm font-medium truncate">
                                                                    {member.user.name}
                                                                    {member.userId === user?.id && (
                                                                        <span className="ml-2 text-xs text-muted-foreground font-normal">
                                                                            (You)
                                                                        </span>
                                                                    )}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground truncate">
                                                                    {member.user.email}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            <Badge
                                                                variant={
                                                                    member.role === "OWNER"
                                                                        ? "default"
                                                                        : member.role === "ADMIN"
                                                                        ? "secondary"
                                                                        : "outline"
                                                                }
                                                                className="text-xs"
                                                            >
                                                                {member.role.toLowerCase()}
                                                            </Badge>

                                                            {/* Member role & remove dropdown */}
                                                            {(currentUserRole === "OWNER" ||
                                                                (currentUserRole === "ADMIN" && member.role === "MEMBER")) &&
                                                                member.userId !== user?.id && (
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-8 w-8"
                                                                            >
                                                                                <MoreHorizontal className="h-4 w-4" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end">
                                                                            {currentUserRole === "OWNER" && (
                                                                                <>
                                                                                    {member.role !== "ADMIN" && (
                                                                                        <DropdownMenuItem
                                                                                            onClick={() =>
                                                                                                handleChangeRole(
                                                                                                    member.userId,
                                                                                                    "ADMIN"
                                                                                                )
                                                                                            }
                                                                                        >
                                                                                            <Shield className="mr-2 h-4 w-4" />
                                                                                            Make Admin
                                                                                        </DropdownMenuItem>
                                                                                    )}
                                                                                    {member.role !== "MEMBER" && (
                                                                                        <DropdownMenuItem
                                                                                            onClick={() =>
                                                                                                handleChangeRole(
                                                                                                    member.userId,
                                                                                                    "MEMBER"
                                                                                                )
                                                                                            }
                                                                                        >
                                                                                            <UserRound className="mr-2 h-4 w-4" />
                                                                                            Make Member
                                                                                        </DropdownMenuItem>
                                                                                    )}
                                                                                    <DropdownMenuSeparator />
                                                                                </>
                                                                            )}

                                                                            <DropdownMenuItem
                                                                                className="text-destructive focus:text-destructive"
                                                                                onClick={() =>
                                                                                    handleRemoveMember(member.userId)
                                                                                }
                                                                            >
                                                                                <UserMinus className="mr-2 h-4 w-4" />
                                                                                Remove Member
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </section>
                        </div>
                    )}
                </main>
            </div>

            {/* Create Board Dialog */}
            <CreateBoardDialog
                open={createBoardOpen}
                onOpenChange={setCreateBoardOpen}
                workspaceId={workspace.id}
                onCreated={loadBoards}
            />
        </div>
    );
}