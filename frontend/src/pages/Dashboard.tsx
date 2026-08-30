
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    LayoutDashboard,
    LogOut,
    Plus,
    Settings,
    User,
    Loader2,
    FolderKanban,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

import {
    getWorkspaces,
    type Workspace,
} from "@/api/workspace.api";

import { CreateWorkspaceDialog } from "@/components/workspace/CreateWorkspaceDialog";

import { Button } from "@/components/ui/button";

import {
    Avatar,
    AvatarFallback,
} from "@/components/ui/avatar";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
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

    const [workspaces, setWorkspaces] =
        useState<Workspace[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

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
        <div className="flex min-h-screen bg-muted/30">

            {/* Sidebar */}

            <aside className="hidden w-64 border-r bg-background md:flex md:flex-col">

                {/* Logo */}

                <div className="flex h-16 items-center border-b px-6">
                    <span className="text-2xl font-bold tracking-tight">
                        wabi
                    </span>
                </div>

                {/* Navigation */}

                <nav className="flex-1 space-y-1 p-4">

                    <Button
                        variant="secondary"
                        className="w-full justify-start"
                    >
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Overview
                    </Button>

                    <CreateWorkspaceDialog
                        onCreated={loadWorkspaces}
                    />

                </nav>

                {/* User */}

                <div className="border-t p-4">

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

            {/* Main */}

            <main className="flex-1">

                {/* Header */}

                <header className="flex h-16 items-center justify-between border-b bg-background px-6">

                    <div>

                        <h1 className="text-lg font-semibold">
                            Overview
                        </h1>

                        <p className="text-sm text-muted-foreground">
                            Welcome back, {user?.name}.
                        </p>

                    </div>

                    <CreateWorkspaceDialog
                        onCreated={loadWorkspaces}
                    />

                </header>

                {/* Content */}

                <div className="p-6">

                    {/* Error */}

                    {error && (
                        <div
                            role="alert"
                            className="mb-6 rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                        >
                            {error}
                        </div>
                    )}

                    {/* Stats */}

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                        <Card>

                            <CardHeader>
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Workspaces
                                </CardTitle>
                            </CardHeader>

                            <CardContent>

                                <p className="text-3xl font-bold">
                                    {loading ? (
                                        <Loader2 className="h-7 w-7 animate-spin" />
                                    ) : (
                                        workspaces.length
                                    )}
                                </p>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    {workspaces.length === 0
                                        ? "No workspaces yet"
                                        : "Active workspaces"}
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
                                    0
                                </p>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Create your first board
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
                                    Nothing assigned yet
                                </p>

                            </CardContent>

                        </Card>

                    </div>

                    {/* Workspaces */}

                    <div className="mt-8">

                        <div className="mb-4 flex items-center justify-between">

                            <div>
                                <h2 className="text-lg font-semibold">
                                    Your workspaces
                                </h2>

                                <p className="text-sm text-muted-foreground">
                                    Projects and teams you're part of.
                                </p>
                            </div>

                        </div>

                        {loading ? (

                            <Card>

                                <CardContent className="flex min-h-48 items-center justify-center">

                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />

                                </CardContent>

                            </Card>

                        ) : workspaces.length === 0 ? (

                            <Card>

                                <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">

                                    <div className="mb-4 rounded-full bg-muted p-4">

                                        <LayoutDashboard className="h-6 w-6 text-muted-foreground" />

                                    </div>

                                    <h2 className="text-lg font-semibold">
                                        Your workspace starts here
                                    </h2>

                                    <p className="mt-2 max-w-md text-sm text-muted-foreground">
                                        Create a workspace to start organizing
                                        projects, boards, tasks, and your team.
                                    </p>

                                    <div className="mt-6">
                                        <CreateWorkspaceDialog
                                            onCreated={loadWorkspaces}
                                        />
                                    </div>

                                </CardContent>

                            </Card>

                        ) : (

                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                                {workspaces.map(
                                    (workspace) => (
                                        <Card
                                            key={workspace.id}
                                            className="cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md"
                                            onClick={() =>
                                                navigate(
                                                    `/workspaces/${workspace.id}`
                                                )
                                            }
                                        >

                                            <CardContent className="p-5">

                                                <div className="flex items-start justify-between">

                                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">

                                                        <FolderKanban className="h-5 w-5 text-primary" />

                                                    </div>

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
                                    )
                                )}

                            </div>

                        )}

                    </div>

                </div>

            </main>

        </div>
    );
}
