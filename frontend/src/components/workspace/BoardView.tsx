import { useEffect, useState } from "react";

import type { Board } from "@/api/board.api";

import {
    deleteList,
    getBoardLists,
    updateList,
    type BoardList,
} from "@/api/list.api";

import {
    deleteTask,
    getListTasks,
    moveTask,
    updateTask,
    type Task,
} from "@/api/task.api";

import BoardColumn from "../board/BoardColumn";
import BoardEmptyState from "../board/BoardEmptyState";
import BoardHeader from "../board/BoardHeader";
import BoardToolbar, {
    type SortOption,
} from "../board/BoardToolbar";
import CreateListDialog from "../board/CreateListDialog";
import CreateTaskDialog from "../board/CreateTaskDialog";
import DeleteListDialog from "../board/DeleteListDialog";
import DeleteTaskDialog from "../board/DeleteTaskDialog";
import EditTaskDialog from "../board/EditTaskDialog";
import RenameListDialog from "../board/RenameListDialog";

import BoardDndContext from "../dnd/BoardDndContext";

interface BoardViewProps {
    board: Board;
    onBack: () => void;
}

export default function BoardView({
    board,
    onBack,
}: BoardViewProps) {
    const [lists, setLists] = useState<BoardList[]>([]);

    const [tasks, setTasks] = useState<
        Record<string, Task[]>
    >({});

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState<string | null>(
        null,
    );

    const [searchQuery, setSearchQuery] = useState("");

    const [sortOption, setSortOption] =
        useState<SortOption>("position");

    /* List dialogs */
    const [createListOpen, setCreateListOpen] =
        useState(false);

    const [editingList, setEditingList] =
        useState<BoardList | null>(null);

    const [deletingList, setDeletingList] =
        useState<BoardList | null>(null);

    /* Task dialogs */
    const [createTaskList, setCreateTaskList] =
        useState<BoardList | null>(null);

    const [editingTask, setEditingTask] =
        useState<Task | null>(null);

    const [deletingTask, setDeletingTask] =
        useState<Task | null>(null);

    /**
     * Load tasks for all lists.
     */
    const loadTasks = async (
        boardLists: BoardList[],
    ) => {
        try {
            const entries = await Promise.all(
                boardLists.map(async (list) => {
                    const listTasks =
                        await getListTasks(list.id);

                    return [
                        list.id,
                        listTasks,
                    ] as const;
                }),
            );

            setTasks(
                Object.fromEntries(entries),
            );
        } catch (err) {
            console.error(
                "Failed to load tasks:",
                err,
            );

            setError("Failed to load tasks.");
        }
    };

    /**
     * Load lists + tasks.
     */
    const loadLists = async () => {
        try {
            setLoading(true);
            setError(null);

            const data =
                await getBoardLists(board.id);

            setLists(data);

            await loadTasks(data);
        } catch (err) {
            console.error(
                "Failed to load board:",
                err,
            );

            setError("Failed to load board.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLists();
    }, [board.id]);

    /**
     * Get tasks after search + sort.
     */
    const getVisibleTasks = (
        listTasks: Task[],
    ) => {
        const query =
            searchQuery.trim().toLowerCase();

        let visible = listTasks;

        if (query) {
            visible = listTasks.filter((task) => {
                return (
                    task.title
                        .toLowerCase()
                        .includes(query) ||
                    task.description
                        ?.toLowerCase()
                        .includes(query)
                );
            });
        }

        return [...visible].sort((a, b) => {
            switch (sortOption) {
                case "title":
                    return a.title.localeCompare(
                        b.title,
                    );

                case "created":
                    return (
                        new Date(
                            a.createdAt,
                        ).getTime() -
                        new Date(
                            b.createdAt,
                        ).getTime()
                    );

                case "position":
                default:
                    return (
                        a.position -
                        b.position
                    );
            }
        });
    };

    /**
     * Rename list.
     */
    const handleRenameList = async (
        name: string,
    ) => {
        if (!editingList) {
            return;
        }

        try {
            setError(null);

            await updateList(
                editingList.id,
                {
                    name,
                },
            );

            setEditingList(null);

            await loadLists();
        } catch (err) {
            console.error(
                "Failed to rename list:",
                err,
            );

            setError(
                "Failed to rename list.",
            );
        }
    };

    /**
     * Delete list.
     */
    const handleDeleteList = async () => {
        if (!deletingList) {
            return;
        }

        try {
            setError(null);

            await deleteList(
                deletingList.id,
            );

            setDeletingList(null);

            await loadLists();
        } catch (err) {
            console.error(
                "Failed to delete list:",
                err,
            );

            setError(
                "Failed to delete list.",
            );
        }
    };

    /**
     * Update task.
     */
    const handleUpdateTask = async (
        title: string,
        description: string | null,
    ) => {
        if (!editingTask) {
            return;
        }

        try {
            setError(null);

            const updatedTask =
                await updateTask(
                    editingTask.id,
                    {
                        title,
                        description,
                    },
                );

            setTasks((current) => {
                const next = {
                    ...current,
                };

                /*
                 * Remove the old copy from every
                 * list first.
                 *
                 * This keeps state correct even if
                 * the API response changes listId.
                 */
                for (const listId of Object.keys(
                    next,
                )) {
                    next[listId] = (
                        next[listId] ?? []
                    ).filter(
                        (task) =>
                            task.id !==
                            updatedTask.id,
                    );
                }

                next[updatedTask.listId] = [
                    ...(next[
                        updatedTask.listId
                    ] ?? []),
                    updatedTask,
                ];

                return next;
            });

            setEditingTask(null);
        } catch (err) {
            console.error(
                "Failed to update task:",
                err,
            );

            setError(
                "Failed to update task.",
            );

            throw err;
        }
    };

    /**
     * Delete task.
     */
    const handleDeleteTask = async () => {
        if (!deletingTask) {
            return;
        }

        try {
            setError(null);

            await deleteTask(
                deletingTask.id,
            );

            setTasks((current) => {
                const next = {
                    ...current,
                };

                next[deletingTask.listId] = (
                    next[
                        deletingTask.listId
                    ] ?? []
                ).filter(
                    (task) =>
                        task.id !==
                        deletingTask.id,
                );

                return next;
            });

            setDeletingTask(null);
        } catch (err) {
            console.error(
                "Failed to delete task:",
                err,
            );

            setError(
                "Failed to delete task.",
            );

            throw err;
        }
    };

    /**
     * Header Add Task.
     *
     * For now, add to the first list.
     */
    const handleHeaderAddTask = () => {
        if (lists.length === 0) {
            setCreateListOpen(true);
            return;
        }

        const firstList = [...lists].sort(
            (a, b) =>
                a.position - b.position,
        )[0];

        if (!firstList) {
            return;
        }

        setCreateTaskList(firstList);
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] min-h-0 flex-col overflow-hidden">

            <BoardHeader
                board={board}
                onBack={onBack}
                onAddTask={
                    handleHeaderAddTask
                }
                onAddList={() =>
                    setCreateListOpen(true)
                }
                onRefresh={loadLists}
                canAddTask={
                    lists.length > 0
                }
            />

            <BoardToolbar
                searchQuery={searchQuery}
                onSearchChange={
                    setSearchQuery
                }
                sortOption={sortOption}
                onSortChange={
                    setSortOption
                }
            />

            {error && (
                <div className="border-b bg-destructive/10 px-4 py-2 text-sm text-destructive">
                    {error}
                </div>
            )}

            {/* Board */}
            <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden py-4">
                <div className="flex h-full min-w-0 gap-4 px-2">

                    {loading ? (
                        <div className="flex w-full items-center justify-center text-sm text-muted-foreground">
                            Loading board...
                        </div>
                    ) : lists.length ===
                      0 ? (
                        <BoardEmptyState
                            onCreateList={() =>
                                setCreateListOpen(
                                    true,
                                )
                            }
                        />
                    ) : (
                        <BoardDndContext
                            tasks={tasks}
                            onTasksChange={
                                setTasks
                            }
                            onMoveTask={
                                moveTask
                            }
                            disabled={
                                searchQuery
                                    .trim()
                                    .length >
                                    0 ||
                                sortOption !==
                                    "position"
                            }
                        >
                            {lists.map(
                                (list) => {
                                    const listTasks =
                                        tasks[
                                            list.id
                                        ] ?? [];

                                    const visibleTasks =
                                        getVisibleTasks(
                                            listTasks,
                                        );

                                    return (
                                        <BoardColumn
                                            key={
                                                list.id
                                            }
                                            list={
                                                list
                                            }
                                            tasks={
                                                visibleTasks
                                            }
                                            totalTasks={
                                                listTasks.length
                                            }
                                            onAddTask={() =>
                                                setCreateTaskList(
                                                    list,
                                                )
                                            }
                                            onRename={() =>
                                                setEditingList(
                                                    list,
                                                )
                                            }
                                            onDelete={() =>
                                                setDeletingList(
                                                    list,
                                                )
                                            }
                                            onEditTask={(
                                                task,
                                            ) =>
                                                setEditingTask(
                                                    task,
                                                )
                                            }
                                            onDeleteTask={(
                                                task,
                                            ) =>
                                                setDeletingTask(
                                                    task,
                                                )
                                            }
                                        />
                                    );
                                },
                            )}

                            {/* Add list */}
                            <button
                                onClick={() =>
                                    setCreateListOpen(
                                        true,
                                    )
                                }
                                className="flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-lg border border-dashed text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                title="Add list"
                            >
                                <span className="sr-only">
                                    Add list
                                </span>
                                +
                            </button>
                        </BoardDndContext>
                    )}

                </div>
            </div>

            {/* Create list */}
            <CreateListDialog
                open={
                    createListOpen
                }
                onOpenChange={
                    setCreateListOpen
                }
                boardId={board.id}
                onCreated={
                    loadLists
                }
            />

            {/* Rename list */}
            <RenameListDialog
                list={editingList}
                open={
                    editingList !== null
                }
                onOpenChange={(open) => {
                    if (!open) {
                        setEditingList(
                            null,
                        );
                    }
                }}
                onRename={
                    handleRenameList
                }
            />

            {/* Delete list */}
            <DeleteListDialog
                list={deletingList}
                open={
                    deletingList !== null
                }
                onOpenChange={(open) => {
                    if (!open) {
                        setDeletingList(
                            null,
                        );
                    }
                }}
                onConfirm={
                    handleDeleteList
                }
            />

            {/* Create task */}
            <CreateTaskDialog
                open={
                    createTaskList !== null
                }
                onOpenChange={(open) => {
                    if (!open) {
                        setCreateTaskList(
                            null,
                        );
                    }
                }}
                listId={
                    createTaskList?.id ??
                    ""
                }
                listName={
                    createTaskList?.name ??
                    ""
                }
                onCreated={async () => {
                    await loadTasks(
                        lists,
                    );
                }}
            />

            {/* Edit task */}
            <EditTaskDialog
                task={editingTask}
                open={
                    editingTask !== null
                }
                onOpenChange={(open) => {
                    if (!open) {
                        setEditingTask(
                            null,
                        );
                    }
                }}
                onSave={
                    handleUpdateTask
                }
            />

            {/* Delete task */}
            <DeleteTaskDialog
                task={deletingTask}
                open={
                    deletingTask !== null
                }
                onOpenChange={(open) => {
                    if (!open) {
                        setDeletingTask(
                            null,
                        );
                    }
                }}
                onConfirm={
                    handleDeleteTask
                }
            />
        </div>
    );
}