import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    Activity,
    ArrowUpRight,
    FolderKanban,
    LayoutDashboard,
    Loader2,
    LogOut,
    Plus,
    Settings,
    Sparkles,
    User,
    Users,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

import {
    getWorkspaces,
    type Workspace,
} from "@/api/workspace.api";

import { CreateWorkspaceDialog } from "@/components/workspace/CreateWorkspaceDialog";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
    Card,
    CardContent,
} from "@/components/ui/card";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Dashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const loadWorkspaces = useCallback(async () => {
        try {
            setError("");

            const data = await getWorkspaces();

            setWorkspaces(data);
        } catch (error: any) {
            setError(
                error.response?.data?.error?.message ??
                    "Unable to load workspaces."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadWorkspaces();
    }, [loadWorkspaces]);

    const initials =
        user?.name
            ?.split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() ?? "U";

    return (
        <div className="flex h-screen overflow-hidden bg-muted/30">

            {/* ───────────────── Sidebar ───────────────── */}

            <aside className="hidden h-screen w-64 shrink-0 border-r bg-background md:flex md:flex-col">

                {/* Logo */}
                <div className="flex h-16 shrink-0 items-center border-b px-6">
                    <span className="text-2xl font-bold tracking-tight">
                        wabi
                    </span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 p-4">

                    <Button
                        variant="secondary"
                        className="h-9 w-full justify-start"
                    >
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Overview
                    </Button>

                    <CreateWorkspaceDialog
                        onCreated={loadWorkspaces}
                    />

                </nav>

                {/* User */}
                <div className="shrink-0 border-t p-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="h-auto w-full justify-start px-2 py-2"
                            >
                                <Avatar className="mr-3 h-8 w-8">
                                    <AvatarFallback>
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="min-w-0 text-left">
                                    <p className="truncate text-sm font-medium">
                                        {user?.name}
                                    </p>

                                    <p className="truncate text-xs text-muted-foreground">
                                        {user?.email}
                                    </p>
                                </div>
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            align="start"
                            className="w-56"
                        >
                            <DropdownMenuItem>
                                <User className="mr-2 h-4 w-4" />
                                Profile
                            </DropdownMenuItem>

                            <DropdownMenuItem>
                                <Settings className="mr-2 h-4 w-4" />
                                Settings
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                                onClick={handleLogout}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </aside>

            {/* ───────────────── Main ───────────────── */}

            <main className="min-w-0 flex-1 overflow-y-auto">

                {/* Compact Header */}
                <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/95 px-6 backdrop-blur">

                    <div className="min-w-0">
                        <h1 className="text-lg font-semibold">
                            Overview
                        </h1>

                        <p className="truncate text-sm text-muted-foreground">
                            Welcome back, {user?.name}.
                        </p>
                    </div>

                    <CreateWorkspaceDialog
                        onCreated={loadWorkspaces}
                    />
                </header>

                {/* Content */}
                <div className="mx-auto w-full max-w-[1600px] p-6">

                    {/* Error */}
                    {error && (
                        <div
                            role="alert"
                            className="mb-5 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                        >
                            {error}
                        </div>
                    )}

                    {/* ───────────────── Stats ───────────────── */}

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                        <StatCard
                            icon={
                                <FolderKanban className="h-4 w-4" />
                            }
                            label="Workspaces"
                            value={
                                loading ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    workspaces.length
                                )
                            }
                            description={
                                workspaces.length === 0
                                    ? "No workspaces yet"
                                    : "Active workspaces"
                            }
                        />

                        <StatCard
                            icon={
                                <Activity className="h-4 w-4" />
                            }
                            label="Boards"
                            value="0"
                            description="Across your workspaces"
                        />

                        <StatCard
                            icon={
                                <Users className="h-4 w-4" />
                            }
                            label="Tasks"
                            value="0"
                            description="Nothing assigned yet"
                        />

                    </div>

                    {/* ───────────────── Workspaces ───────────────── */}

                    <section className="mt-8">

                        <div className="mb-4 flex items-end justify-between">

                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-semibold">
                                        Your workspaces
                                    </h2>

                                    {workspaces.length > 0 && (
                                        <Badge variant="secondary">
                                            {workspaces.length}
                                        </Badge>
                                    )}
                                </div>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Projects and teams you're part of.
                                </p>
                            </div>

                            {workspaces.length > 0 && (
                                <CreateWorkspaceDialog
                                    onCreated={loadWorkspaces}
                                />
                            )}

                        </div>

                        {loading ? (
                            <WorkspaceLoading />
                        ) : workspaces.length === 0 ? (
                            <EmptyWorkspace
                                onCreated={loadWorkspaces}
                            />
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {workspaces.map((workspace) => (
                                    <WorkspaceCard
                                        key={workspace.id}
                                        workspace={workspace}
                                        onClick={() =>
                                            navigate(
                                                `/workspaces/${workspace.id}`
                                            )
                                        }
                                    />
                                ))}
                            </div>
                        )}

                    </section>

                    {/* ───────────────── Quick Start ───────────────── */}

                    <section className="mt-8">

                        <div className="rounded-xl border bg-background p-5">

                            <div className="flex items-start gap-4">

                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                </div>

                                <div className="min-w-0">
                                    <h3 className="font-semibold">
                                        Keep your work organized
                                    </h3>

                                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                                        Create a workspace, add boards, and
                                        start turning your ideas into
                                        actionable tasks.
                                    </p>
                                </div>

                            </div>

                        </div>

                    </section>

                </div>
            </main>
        </div>
    );
}

/* ───────────────── Stat Card ───────────────── */

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
    description: string;
}

function StatCard({
    icon,
    label,
    value,
    description,
}: StatCardProps) {
    return (
        <Card className="overflow-hidden">
            <CardContent className="p-5">

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                            {icon}
                        </div>

                        {label}
                    </div>

                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="mt-5">
                    <div className="text-3xl font-bold tracking-tight">
                        {value}
                    </div>

                    <p className="mt-1 text-xs text-muted-foreground">
                        {description}
                    </p>
                </div>

            </CardContent>
        </Card>
    );
}

/* ───────────────── Workspace Card ───────────────── */

interface WorkspaceCardProps {
    workspace: Workspace;
    onClick: () => void;
}

function WorkspaceCard({
    workspace,
    onClick,
}: WorkspaceCardProps) {
    return (
        <Card
            className="group cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            onClick={onClick}
        >
            <CardContent className="p-5">

                <div className="flex items-start justify-between">

                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <FolderKanban className="h-5 w-5 text-primary" />
                    </div>

                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />

                </div>

                <div className="mt-5">

                    <h3 className="font-semibold">
                        {workspace.name}
                    </h3>

                    <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
                        {workspace.description ||
                            "No description"}
                    </p>

                </div>

                <div className="mt-5 flex items-center justify-between border-t pt-4">

                    <span className="text-xs text-muted-foreground">
                        Workspace
                    </span>

                    <span className="text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                        Open workspace →
                    </span>

                </div>

            </CardContent>
        </Card>
    );
}

/* ───────────────── Loading ───────────────── */

function WorkspaceLoading() {
    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
                <Card key={item}>
                    <CardContent className="flex h-48 items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

/* ───────────────── Empty State ───────────────── */

function EmptyWorkspace({
    onCreated,
}: {
    onCreated: () => void | Promise<void>;
}) {
    return (
        <Card>
            <CardContent className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">

                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                    <FolderKanban className="h-7 w-7 text-muted-foreground" />
                </div>

                <h2 className="text-xl font-semibold">
                    Your workspace starts here
                </h2>

                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                    Create a workspace to start organizing projects,
                    boards, tasks, and your team.
                </p>

                <div className="mt-6">
                    <CreateWorkspaceDialog
                        onCreated={onCreated}
                    />
                </div>

            </CardContent>
        </Card>
    );
}