import {
    ArrowLeft,
    CheckCircle2,
    Circle,
    Filter,
    MoreHorizontal,
    Pencil,
    Plus,
    Search,
    SlidersHorizontal,
    Trash2,
    UserPlus,
} from "lucide-react";

import { useEffect, useState } from "react";

import type { Board } from "@/api/board.api";

import {
    deleteList,
    getBoardLists,
    updateList,
    type BoardList,
} from "@/api/list.api";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import CreateListDialog from "./CreateListDialog";
import RenameListDialog from "./RenameListDialog";

interface BoardViewProps {
    board: Board;
    onBack: () => void;
}

export default function BoardView({
    board,
    onBack,
}: BoardViewProps) {
    const [lists, setLists] = useState<BoardList[]>([]);
    const [loading, setLoading] = useState(true);

    const [createListOpen, setCreateListOpen] = useState(false);
    const [editingList, setEditingList] =
        useState<BoardList | null>(null);
    const [deletingList, setDeletingList] =
        useState<BoardList | null>(null);

    const loadLists = async () => {
        try {
            setLoading(true);

            const data = await getBoardLists(board.id);

            setLists(data);
        } catch (error) {
            console.error("Failed to load lists", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLists();
    }, [board.id]);

    const handleRenameList = async (name: string) => {
        if (!editingList) return;

        try {
            await updateList(editingList.id, {
                name,
            });

            await loadLists();

            setEditingList(null);
        } catch (error) {
            console.error("Failed to rename list", error);
        }
    };

    const handleDeleteList = async () => {
        if (!deletingList) return;

        try {
            await deleteList(deletingList.id);

            await loadLists();

            setDeletingList(null);
        } catch (error) {
            console.error("Failed to delete list", error);
        }
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] min-h-0 flex-col overflow-hidden">

            {/* Header */}
            <div className="flex h-14 shrink-0 items-center justify-between gap-4 border-b">

                {/* Left side */}
                <div className="flex min-w-0 items-center gap-2">

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onBack}
                        className="h-8 w-8 shrink-0"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                        <Circle className="h-4 w-4 text-primary" />
                    </div>

                    <div className="flex min-w-0 items-center gap-2">

                        <h1 className="truncate text-base font-semibold">
                            {board.name}
                        </h1>

                        <Badge
                            variant="secondary"
                            className="hidden shrink-0 sm:inline-flex"
                        >
                            Board
                        </Badge>

                        {board.description && (
                            <>
                                <span className="hidden text-muted-foreground sm:inline">
                                    /
                                </span>

                                <span className="hidden max-w-[300px] truncate text-sm text-muted-foreground md:inline">
                                    {board.description}
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* Right side */}
                <div className="flex shrink-0 items-center gap-1">

                    {/* Search */}
                    <div className="relative hidden w-48 lg:block">
                        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />

                        <Input
                            placeholder="Search tasks..."
                            className="h-8 pl-8 text-xs"
                        />
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8"
                    >
                        <Filter className="mr-1.5 h-3.5 w-3.5" />
                        Filter
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8"
                    >
                        <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
                        Sort
                    </Button>

                    {/* Members */}
                    <div className="ml-1 hidden items-center sm:flex">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary text-[10px] font-medium text-primary-foreground">
                            Y
                        </div>

                        <div className="-ml-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium">
                            A
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        className="ml-1 h-8"
                    >
                        <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                        Share
                    </Button>

                    <Button
                        size="sm"
                        className="h-8"
                    >
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        Add task
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                    >
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Board */}
            <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden py-4">

                <div className="flex h-full min-w-0 gap-4">

                    {loading ? (
                        <div className="flex w-full items-center justify-center text-sm text-muted-foreground">
                            Loading lists...
                        </div>
                    ) : (
                        lists.map((list) => (
                            <KanbanColumn
                                key={list.id}
                                list={list}
                                count={0}
                                icon={
                                    <Circle className="h-3.5 w-3.5" />
                                }
                                onRename={() =>
                                    setEditingList(list)
                                }
                                onDelete={() =>
                                    setDeletingList(list)
                                }
                            />
                        ))
                    )}

                    {/* Add list */}
                    <button
                        onClick={() => setCreateListOpen(true)}
                        className="flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-lg border border-dashed text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        title="Add list"
                    >
                        <Plus className="h-4 w-4" />
                    </button>

                </div>
            </div>

            {/* Create list */}
            <CreateListDialog
                open={createListOpen}
                onOpenChange={setCreateListOpen}
                boardId={board.id}
                onCreated={loadLists}
            />

            {/* Rename list */}
            <RenameListDialog
                list={editingList}
                open={editingList !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditingList(null);
                    }
                }}
                onRename={handleRenameList}
            />

            {/* Delete list */}
            <AlertDialog
                open={deletingList !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeletingList(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete list?
                        </AlertDialogTitle>

                        <AlertDialogDescription>
                            Are you sure you want to delete{" "}
                            <strong>
                                {deletingList?.name}
                            </strong>
                            ? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            Cancel
                        </AlertDialogCancel>

                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleDeleteList}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

interface KanbanColumnProps {
    list: BoardList;
    count: number;
    icon: React.ReactNode;
    onRename: () => void;
    onDelete: () => void;
}

function KanbanColumn({
    list,
    count,
    icon,
    onRename,
    onDelete,
}: KanbanColumnProps) {
    return (
        <section className="flex min-w-[260px] flex-1 flex-col rounded-xl border bg-muted/30">

            {/* Column header */}
            <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">

                <div className="flex min-w-0 items-center gap-2">

                    {icon}

                    <h2 className="truncate text-sm font-semibold">
                        {list.name}
                    </h2>

                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {count}
                    </span>
                </div>

                <div className="flex items-center">

                    {/* Add task */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                    >
                        <Plus className="h-3.5 w-3.5" />
                    </Button>

                    {/* List menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                            >
                                <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">

                            <DropdownMenuItem onClick={onRename}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Rename
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                                onClick={onDelete}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>

                        </DropdownMenuContent>
                    </DropdownMenu>

                </div>
            </div>

            {/* Tasks */}
            <div className="min-h-0 flex-1 overflow-y-auto p-3">

                {count === 0 && (
                    <EmptyColumn title={list.name} />
                )}

            </div>
        </section>
    );
}

function EmptyColumn({
    title,
}: {
    title: string;
}) {
    return (
        <div className="flex min-h-[180px] flex-col items-center justify-center rounded-lg border border-dashed bg-background/40 px-5 text-center">

            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                <Plus className="h-4 w-4 text-muted-foreground" />
            </div>

            <p className="text-sm font-medium">
                No tasks in {title}
            </p>

            <p className="mt-1 max-w-[200px] text-xs leading-relaxed text-muted-foreground">
                Add a task to start organizing work here.
            </p>

            <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-8"
            >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add task
            </Button>
        </div>
    );
}