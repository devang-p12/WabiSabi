import { useCallback, useEffect, useState } from "react";
import {
    ArrowLeft,
    Loader2,
    Mail,
    MoreHorizontal,
    Shield,
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
import BoardView from "@/components/workspace/BoardView"

import { useAuth } from "@/context/AuthContext";

export default function Workspace() {
    const { user } = useAuth();

    const { workspaceId } = useParams();
    const navigate = useNavigate();

    const [workspace, setWorkspace] =
        useState<WorkspaceType | null>(null);

    const [members, setMembers] =
        useState<WorkspaceMember[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [boards, setBoards] = useState<Board[]>([]);
    const [boardsLoading, setBoardsLoading] = useState(true);
    const [createBoardOpen, setCreateBoardOpen] = useState(false);

    const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const loadBoards = async () => {
        if (!workspaceId) return;

        try {
            setBoardsLoading(true);

            const data = await getWorkspaceBoards(workspaceId);

            setBoards(data);
        } catch (error) {
            console.error("Failed to load boards:", error);
        } finally {
            setBoardsLoading(false);
        }
    };

    const [error, setError] =
        useState("");

    const loadWorkspace = useCallback(async () => {
        if (!workspaceId) return;

        try {
            setLoading(true);
            setError("");

            const [workspaceData, membersData] =
                await Promise.all([
                    getWorkspace(workspaceId),
                    getWorkspaceMembers(workspaceId),
                ]);

            setWorkspace(workspaceData);
            setMembers(membersData);
        } catch (error: any) {
            setError(
                error.response?.data?.error?.message ??
                "Unable to load workspace."
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

            await updateWorkspaceMember(
                workspaceId,
                userId,
                role
            );

            await loadWorkspace();
        } catch (error: any) {
            setError(
                error.response?.data?.error?.message ??
                "Unable to update member."
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

            await removeWorkspaceMember(
                workspaceId,
                userId
            );

            await loadWorkspace();
        } catch (error: any) {
            setError(
                error.response?.data?.error?.message ??
                "Unable to remove member."
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
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !workspace) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center">
                <h1 className="text-lg font-semibold">
                    Unable to load workspace
                </h1>

                <p className="mt-2 text-sm text-muted-foreground">
                    {error || "Workspace not found."}
                </p>

                <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() =>
                        navigate("/dashboard")
                    }
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to dashboard
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/30">

            {/* Header */}

            <header className="border-b bg-background">

                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

                    <div className="flex items-center gap-4">

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                                navigate("/dashboard")
                            }
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Workspaces
                        </Button>

                        <div className="h-5 w-px bg-border" />

                        <div>
                            <h1 className="font-semibold">
                                {workspace.name}
                            </h1>

                            <p className="text-xs text-muted-foreground">
                                {workspace.description ||
                                    "No description"}
                            </p>
                        </div>

                    </div>

                </div>

            </header>

            {/* Content */}
            {/* Workspace layout */}
            <div className="flex min-h-[calc(100vh-4rem)] w-full">
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

                <main className="min-w-0 flex-1 p-6">
                    {selectedBoard ? (
                        <BoardView board={selectedBoard} />
                    ) : (
                        <>
                            {/* Workspace heading */}

                            <div className="mb-8">

                                <h2 className="text-3xl font-bold tracking-tight">
                                    {workspace.name}
                                </h2>

                                <p className="mt-1 text-muted-foreground">
                                    {workspace.description ||
                                        "Start organizing your work."}
                                </p>

                            </div>

                            {/* Stats */}

                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-medium text-muted-foreground">
                                            Members
                                        </CardTitle>
                                    </CardHeader>

                                    <CardContent>
                                        <p className="text-3xl font-bold">
                                            {members.length}
                                        </p>

                                        <p className="mt-1 text-sm text-muted-foreground">
                                            People in this workspace
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-medium text-muted-foreground">
                                            Boards
                                        </CardTitle>
                                    </CardHeader>

                                    <CardContent>
                                        <p className="text-3xl font-bold">
                                            {boards.length}
                                        </p>

                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {boards.length === 1
                                                ? "Board in this workspace"
                                                : "Boards in this workspace"}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-medium text-muted-foreground">
                                            Tasks
                                        </CardTitle>
                                    </CardHeader>

                                    <CardContent>
                                        <p className="text-3xl font-bold">
                                            0
                                        </p>

                                        <p className="mt-1 text-sm text-muted-foreground">
                                            No tasks yet
                                        </p>
                                    </CardContent>
                                </Card>

                            </div>

                            {/* Members */}

                            <Card className="mt-6">

                                <CardHeader>
                                    <div className="flex items-center justify-between">

                                        <div>
                                            <CardTitle>
                                                Members
                                            </CardTitle>

                                            <p className="mt-1 text-sm text-muted-foreground">
                                                People who have access to this workspace.
                                            </p>
                                        </div>

                                        {(currentUserRole === "OWNER" ||
                                            currentUserRole === "ADMIN") && (
                                                <AddMemberDialog
                                                    workspaceId={workspace.id}
                                                    onAdded={loadWorkspace}
                                                />
                                            )}

                                    </div>
                                </CardHeader>

                                <CardContent>

                                    {members.length === 0 ? (
                                        <div className="flex min-h-32 flex-col items-center justify-center text-center">
                                            <Users className="mb-2 h-6 w-6 text-muted-foreground" />

                                            <p className="font-medium">
                                                No members
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="divide-y">

                                            {members.map((member) => (
                                                <div
                                                    key={member.userId}
                                                    className="flex items-center justify-between py-4"
                                                >

                                                    <div className="flex items-center gap-3">

                                                        <Avatar>
                                                            <AvatarFallback>
                                                                {getInitials(
                                                                    member.user.name
                                                                )}
                                                            </AvatarFallback>
                                                        </Avatar>

                                                        <div>
                                                            <p className="text-sm font-medium">
                                                                {member.user.name}
                                                            </p>

                                                            <p className="text-xs text-muted-foreground">
                                                                {member.user.email}
                                                            </p>
                                                        </div>

                                                    </div>

                                                    <div className="flex items-center gap-2">

                                                        <Badge variant="secondary">
                                                            {member.role}
                                                        </Badge>

                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    disabled={member.role === "OWNER"}
                                                                >
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>

                                                            <DropdownMenuContent align="end">
                                                                {currentUserRole === "OWNER" && (
                                                                    <>
                                                                        {member.role === "ADMIN" ? (
                                                                            <DropdownMenuItem
                                                                                onClick={() =>
                                                                                    handleChangeRole(
                                                                                        member.userId,
                                                                                        "MEMBER"
                                                                                    )
                                                                                }
                                                                            >
                                                                                <UserRound className="mr-2 h-4 w-4" />
                                                                                Make member
                                                                            </DropdownMenuItem>
                                                                        ) : (
                                                                            <DropdownMenuItem
                                                                                onClick={() =>
                                                                                    handleChangeRole(
                                                                                        member.userId,
                                                                                        "ADMIN"
                                                                                    )
                                                                                }
                                                                            >
                                                                                <Shield className="mr-2 h-4 w-4" />
                                                                                Make admin
                                                                            </DropdownMenuItem>
                                                                        )}

                                                                        <DropdownMenuSeparator />

                                                                        <DropdownMenuItem
                                                                            className="text-destructive"
                                                                            onClick={() =>
                                                                                handleRemoveMember(member.userId)
                                                                            }
                                                                        >
                                                                            <UserMinus className="mr-2 h-4 w-4" />
                                                                            Remove member
                                                                        </DropdownMenuItem>
                                                                    </>
                                                                )}

                                                                {currentUserRole === "ADMIN" &&
                                                                    member.role === "MEMBER" && (
                                                                        <DropdownMenuItem
                                                                            className="text-destructive"
                                                                            onClick={() =>
                                                                                handleRemoveMember(member.userId)
                                                                            }
                                                                        >
                                                                            <UserMinus className="mr-2 h-4 w-4" />
                                                                            Remove member
                                                                        </DropdownMenuItem>
                                                                    )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>

                                                    </div>

                                                </div>
                                            ))}

                                        </div>
                                    )}

                                </CardContent>

                            </Card>
                        </>
                    )}

                </main>
            </div>
            <CreateBoardDialog
                open={createBoardOpen}
                onOpenChange={setCreateBoardOpen}
                workspaceId={workspace.id}
                onCreated={loadBoards}
            />


        </div>
    );
}