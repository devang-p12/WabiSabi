import { useEffect, useState, useRef } from "react";

import type { Board } from "@/api/board.api";

import {
    createList,
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
    type TaskPriority,
} from "@/api/task.api";

import BoardColumn from "../board/BoardColumn";
import BoardEmptyState from "../board/BoardEmptyState";
import BoardHeader from "../board/BoardHeader";
import BoardToolbar, {
    type SortOption,
    type PriorityFilter,
    type DueDateFilter,
    type StatusFilter,
    type BoardViewMode,
} from "../board/BoardToolbar";
import BoardTableView from "../board/BoardTableView";
import BoardCalendarView from "../board/BoardCalendarView";
import WorkspaceAnalyticsDashboard from "../analytics/WorkspaceAnalyticsDashboard";
import CreateListDialog from "../board/CreateListDialog";
import CreateTaskDialog from "../board/CreateTaskDialog";
import DeleteListDialog from "../board/DeleteListDialog";
import DeleteTaskDialog from "../board/DeleteTaskDialog";
import TaskDetailsDialog from "../board/TaskDetailsDialog";
import EditTaskDialog from "../board/EditTaskDialog";
import RenameListDialog from "../board/RenameListDialog";
import { getWorkspaceMembers, type WorkspaceMember } from "@/api/workspace.api";

import BoardDndContext from "../dnd/BoardDndContext";
import { useSocket } from "@/contexts/SocketContext";
import { useAuth } from "@/context/AuthContext";
import LiveCursors, { type RemoteCursor } from "../board/LiveCursors";
import { type BoardUserPresence } from "../board/OnlineMembers";

interface BoardViewProps {
    board: Board;
    onBack?: () => void;
}

export default function BoardView({
    board,
    onBack,
}: BoardViewProps) {
    const { user } = useAuth();
    const [lists, setLists] = useState<BoardList[]>([]);

    const [tasks, setTasks] = useState<
        Record<string, Task[]>
    >({});

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState<string | null>(
        null,
    );
    const [isCreatingStarters, setIsCreatingStarters] = useState(false);

    // Live Collaboration Presence & Cursors
    const [onlineMembers, setOnlineMembers] = useState<BoardUserPresence[]>([]);
    const [remoteCursors, setRemoteCursors] = useState<Record<string, RemoteCursor>>({});
    const [remoteDraggingMap, setRemoteDraggingMap] = useState<Record<string, { userName: string; color: string }>>({});
    const boardCanvasRef = useRef<HTMLDivElement>(null);
    const lastCursorEmit = useRef<number>(0);

    const handleAddStarterColumns = async () => {
        try {
            setIsCreatingStarters(true);
            setError(null);
            await createList(board.id, { name: "To Do" });
            await createList(board.id, { name: "In Progress" });
            await createList(board.id, { name: "Done" });
            await loadLists();
        } catch (err: any) {
            setError(
                err.response?.data?.error?.message ??
                "Failed to create starter columns."
            );
        } finally {
            setIsCreatingStarters(false);
        }
    };

    // Multi-View state (Board / Table / Calendar)
    const [viewMode, setViewMode] = useState<BoardViewMode>(() => {
        try {
            const saved =
                localStorage.getItem(`wabi_board_view_${board.id}`) ||
                localStorage.getItem("wabi_preferred_view");
            if (saved === "table" || saved === "calendar" || saved === "board" || saved === "analytics") {
                return saved as BoardViewMode;
            }
        } catch {}
        return "board";
    });

    const handleViewChange = (mode: BoardViewMode) => {
        setViewMode(mode);
        try {
            localStorage.setItem(`wabi_board_view_${board.id}`, mode);
            localStorage.setItem("wabi_preferred_view", mode);
        } catch {}
    };

    const [calendarNewTaskDate, setCalendarNewTaskDate] = useState<string | undefined>(undefined);

    const [searchQuery, setSearchQuery] = useState("");

    const [sortOption, setSortOption] =
        useState<SortOption>("position");

    const [priorityFilter, setPriorityFilter] =
        useState<PriorityFilter>("ALL");

    const [statusFilter, setStatusFilter] =
        useState<StatusFilter>("ALL");

    const [dueDateFilter, setDueDateFilter] =
        useState<DueDateFilter>("ALL");

    const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
    const [assigneeFilter, setAssigneeFilter] = useState<string>("ALL");

    useEffect(() => {
        if (board.workspaceId) {
            getWorkspaceMembers(board.workspaceId)
                .then(setWorkspaceMembers)
                .catch((err) => console.error("Failed to load workspace members:", err));
        }
    }, [board.workspaceId]);

    /* List dialogs */
    const [createListOpen, setCreateListOpen] =
        useState(false);

    const [editingList, setEditingList] =
        useState<BoardList | null>(null);

    const [selectedTask, setSelectedTask] =
        useState<Task | null>(null);

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

            const newTasksMap = Object.fromEntries(entries);
            setTasks(newTasksMap);

            // Keep currently open modal in sync if active
            setSelectedTask((current) => {
                if (!current) return null;
                for (const listTasks of Object.values(newTasksMap)) {
                    const matched = listTasks.find((t) => t.id === current.id);
                    if (matched) return matched;
                }
                return current;
            });
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
    const loadLists = async (silent = false) => {
        try {
            if (!silent) {
                setLoading(true);
            }
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
            if (!silent) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        loadLists();
    }, [board.id]);

    const { socket } = useSocket();

    useEffect(() => {
        if (!socket) return;

        const joinRoom = () => {
            console.log(`[BoardView] Joining room board_${board.id} (socket id: ${socket.id})`);
            socket.emit("join_board", {
                boardId: board.id,
                user: user
                    ? {
                          id: user.id,
                          name: user.name,
                          email: user.email,
                          avatarUrl: user.avatarUrl,
                      }
                    : undefined,
            });
        };

        if (socket.connected) {
            joinRoom();
        }

        socket.on("connect", joinRoom);

        const handleBoardUpdated = () => {
            console.log(`[BoardView] Real-time board_updated received for board ${board.id}`);
            loadLists(true); // Silent reload so board state refreshes seamlessly
        };

        const handlePresenceState = (members: BoardUserPresence[]) => {
            setOnlineMembers(members);
            const memberSockets = new Set(members.map((m) => m.socketId));
            setRemoteCursors((prev) => {
                const next: Record<string, RemoteCursor> = {};
                for (const [id, c] of Object.entries(prev)) {
                    if (memberSockets.has(id)) next[id] = c;
                }
                return next;
            });
        };

        const handleUserCursor = (data: {
            socketId: string;
            userId: string;
            name: string;
            color: string;
            x: number;
            y: number;
            draggingTaskId?: string | null;
            draggingTaskTitle?: string | null;
        }) => {
            if (data.userId === user?.id || data.socketId === socket.id) return;
            setRemoteCursors((prev) => ({
                ...prev,
                [data.socketId]: {
                    socketId: data.socketId,
                    userId: data.userId,
                    name: data.name,
                    color: data.color,
                    x: data.x,
                    y: data.y,
                    draggingTaskId: data.draggingTaskId,
                    draggingTaskTitle: data.draggingTaskTitle,
                },
            }));
        };

        const handleUserCursorLeave = (data: { socketId: string; userId?: string }) => {
            setRemoteCursors((prev) => {
                const next = { ...prev };
                delete next[data.socketId];
                return next;
            });
        };

        const handleCardDragStart = (data: {
            socketId: string;
            userId: string;
            userName: string;
            color: string;
            taskId: string;
            taskTitle?: string | null;
        }) => {
            if (data.userId === user?.id || data.socketId === socket.id) return;
            setRemoteDraggingMap((prev) => ({
                ...prev,
                [data.taskId]: {
                    userName: data.userName,
                    color: data.color,
                },
            }));
        };

        const handleCardDragEnd = (data: { socketId: string; userId: string; taskId?: string }) => {
            if (data.taskId) {
                setRemoteDraggingMap((prev) => {
                    const next = { ...prev };
                    delete next[data.taskId!];
                    return next;
                });
            }
        };

        socket.on("board_updated", handleBoardUpdated);
        socket.on("presence_state", handlePresenceState);
        socket.on("user_cursor", handleUserCursor);
        socket.on("user_cursor_leave", handleUserCursorLeave);
        socket.on("card_drag_start", handleCardDragStart);
        socket.on("card_drag_end", handleCardDragEnd);

        return () => {
            socket.off("connect", joinRoom);
            socket.off("board_updated", handleBoardUpdated);
            socket.off("presence_state", handlePresenceState);
            socket.off("user_cursor", handleUserCursor);
            socket.off("user_cursor_leave", handleUserCursorLeave);
            socket.off("card_drag_start", handleCardDragStart);
            socket.off("card_drag_end", handleCardDragEnd);
            socket.emit("leave_board", board.id);
        };
    }, [socket, board.id, user]);

    /**
     * Get tasks after search + sort.
     */
    const getVisibleTasks = (listTasks: Task[]) => {

        console.log("SORT:", sortOption);

        let visibleTasks = listTasks;

        // Search filter
        if (searchQuery.trim()) {
            visibleTasks = visibleTasks.filter((task) =>
                task.title
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter === "ACTIVE") {
            visibleTasks = visibleTasks.filter(
                (task) => !task.completed
            );
        }

        if (statusFilter === "COMPLETED") {
            visibleTasks = visibleTasks.filter(
                (task) => task.completed
            );
        }

        // Priority filter
        if (priorityFilter !== "ALL") {
            visibleTasks = visibleTasks.filter(
                (task) => task.priority === priorityFilter
            );
        }

        // Due date filter
        if (dueDateFilter !== "ALL") {
            const now = new Date();

            visibleTasks = visibleTasks.filter((task) => {

                if (dueDateFilter === "NO_DATE") {
                    return task.dueDate === null;
                }

                if (!task.dueDate) {
                    return false;
                }

                const dueDate = new Date(task.dueDate);

                if (dueDateFilter === "OVERDUE") {
                    return dueDate < now;
                }

                if (dueDateFilter === "TODAY") {
                    return (
                        dueDate.getFullYear() === now.getFullYear() &&
                        dueDate.getMonth() === now.getMonth() &&
                        dueDate.getDate() === now.getDate()
                    );
                }

                if (dueDateFilter === "THIS_WEEK") {
                    const startOfWeek = new Date(now);

                    startOfWeek.setHours(0, 0, 0, 0);

                    // Monday = start of week
                    const day = startOfWeek.getDay();
                    const daysFromMonday =
                        day === 0 ? 6 : day - 1;

                    startOfWeek.setDate(
                        startOfWeek.getDate() - daysFromMonday
                    );

                    const endOfWeek = new Date(startOfWeek);

                    endOfWeek.setDate(
                        endOfWeek.getDate() + 7
                    );

                    return (
                        dueDate >= startOfWeek &&
                        dueDate < endOfWeek
                    );
                }

                return true;
            });
        }

        // Assignee filter
        if (assigneeFilter === "ME" && user?.id) {
            visibleTasks = visibleTasks.filter((task) => task.assigneeId === user.id);
        } else if (assigneeFilter !== "ALL") {
            visibleTasks = visibleTasks.filter((task) => task.assigneeId === assigneeFilter);
        }

        // Sorting
        return [...visibleTasks].sort((a, b) => {

            switch (sortOption) {

                case "title":
                    return a.title.localeCompare(b.title);

                case "created":
                    return (
                        new Date(a.createdAt).getTime() -
                        new Date(b.createdAt).getTime()
                    );

                case "dueDateAsc":
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;

                    return (
                        new Date(a.dueDate).getTime() -
                        new Date(b.dueDate).getTime()
                    );

                case "dueDateDesc":
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;

                    return (
                        new Date(b.dueDate).getTime() -
                        new Date(a.dueDate).getTime()
                    );

                case "position":
                default:
                    return a.position - b.position;
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
        priority: TaskPriority,
        dueDate: string | null,
        assigneeId?: string | null,
    ) => {
        if (!editingTask) return;

        try {
            setError(null);

            const updatedTask = await updateTask(
                editingTask.id,
                {
                    title,
                    description,
                    priority,
                    dueDate,
                    assigneeId,
                },
            );

            setTasks((current) => {
                const next = { ...current };

                for (const listId of Object.keys(next)) {
                    next[listId] = (next[listId] ?? []).map((task) =>
                        task.id === updatedTask.id
                            ? updatedTask
                            : task
                    );
                }

                return next;
            });

            setEditingTask(null);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to update task",
            );
        }
    };


    const handleCompletedChange = (updatedTask: Task) => {
        setTasks((current) => {
            const next = { ...current };

            for (const listId of Object.keys(next)) {
                next[listId] = (next[listId] ?? []).map((task) =>
                    task.id === updatedTask.id
                        ? updatedTask
                        : task
                );
            }

            return next;
        });
    };

    const handleAddTaskForDate = (dateString: string) => {
        if (lists.length === 0) {
            setCreateListOpen(true);
            return;
        }
        const firstList = [...lists].sort((a, b) => a.position - b.position)[0];
        setCalendarNewTaskDate(dateString);
        setCreateTaskList(firstList);
    };

    const handleTableMoveTask = async (
        taskId: string,
        targetListId: string,
        position = 0
    ) => {
        try {
            await moveTask(taskId, targetListId, position);
            await loadLists(true);
        } catch (err) {
            console.error("Failed to move task in table:", err);
        }
    };

    const handleUpdatePriority = async (
        taskId: string,
        priority: TaskPriority
    ) => {
        try {
            await updateTask(taskId, { priority });
            setTasks((current) => {
                const next = { ...current };
                for (const listId of Object.keys(next)) {
                    next[listId] = (next[listId] ?? []).map((t) =>
                        t.id === taskId ? { ...t, priority } : t
                    );
                }
                return next;
            });
        } catch (err) {
            console.error("Failed to update priority in table:", err);
        }
    };

    const handleTableAssignTask = async (
        taskId: string,
        userId: string | null
    ) => {
        try {
            const updated = await updateTask(taskId, { assigneeId: userId });
            setTasks((current) => {
                const next = { ...current };
                for (const listId of Object.keys(next)) {
                    next[listId] = (next[listId] ?? []).map((t) =>
                        t.id === taskId ? updated : t
                    );
                }
                return next;
            });
        } catch (err) {
            console.error("Failed to assign task in table:", err);
        }
    };

    const handleTaskUpdatedFromDialog = (updatedTask: Task) => {
        setTasks((current) => {
            const next = { ...current };
            for (const listId of Object.keys(next)) {
                next[listId] = (next[listId] ?? []).map((t) =>
                    t.id === updatedTask.id ? updatedTask : t
                );
            }
            return next;
        });
        setSelectedTask(updatedTask);
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

    const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!socket || !board.id) return;
        const container = boardCanvasRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left + container.scrollLeft;
        const y = e.clientY - rect.top + container.scrollTop;

        const now = Date.now();
        if (now - lastCursorEmit.current > 35) {
            lastCursorEmit.current = now;
            socket.emit("cursor_move", { boardId: board.id, x, y });
        }
    };

    const handleCanvasMouseLeave = () => {
        if (!socket || !board.id) return;
        socket.emit("cursor_leave", { boardId: board.id });
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
                onlineMembers={onlineMembers}
                currentUserId={user?.id}
            />

            <BoardToolbar
                currentView={viewMode}
                onViewChange={handleViewChange}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sortOption={sortOption}
                onSortChange={setSortOption}
                boardId={board.id}
                onLabelsChange={loadLists}
                priorityFilter={priorityFilter}
                onPriorityFilterChange={setPriorityFilter}
                dueDateFilter={dueDateFilter}
                onDueDateFilterChange={setDueDateFilter}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                assigneeFilter={assigneeFilter}
                onAssigneeFilterChange={setAssigneeFilter}
                workspaceMembers={workspaceMembers}
                currentUserId={user?.id}
            />

            {error && (
                <div className="border-b bg-destructive/10 px-4 py-2 text-sm text-destructive">
                    {error}
                </div>
            )}

            {/* View Mode Content */}
            {viewMode === "table" ? (
                <BoardTableView
                    lists={lists}
                    tasks={tasks}
                    getVisibleTasks={getVisibleTasks}
                    onViewTask={(task) => setSelectedTask(task)}
                    onEditTask={(task) => setEditingTask(task)}
                    onDeleteTask={(task) => setDeletingTask(task)}
                    onCompletedChange={handleCompletedChange}
                    onMoveTask={handleTableMoveTask}
                    onUpdatePriority={handleUpdatePriority}
                    onAssignTask={handleTableAssignTask}
                    onAddTask={(list) => setCreateTaskList(list)}
                    workspaceMembers={workspaceMembers}
                    onCreateStarterColumns={handleAddStarterColumns}
                    isCreatingStarters={isCreatingStarters}
                />
            ) : viewMode === "calendar" ? (
                <BoardCalendarView
                    lists={lists}
                    tasks={tasks}
                    getVisibleTasks={getVisibleTasks}
                    onViewTask={(task) => setSelectedTask(task)}
                    onCompletedChange={handleCompletedChange}
                    onAddTaskForDate={handleAddTaskForDate}
                />
            ) : viewMode === "analytics" ? (
                <div className="flex-1 min-h-0 overflow-y-auto">
                    <WorkspaceAnalyticsDashboard
                        workspaceId={board.workspaceId}
                        initialBoardId={board.id}
                        isBoardView={true}
                    />
                </div>
            ) : (
                /* Board Canvas with Real-Time Multiplayer Cursors */
                <div
                    ref={boardCanvasRef}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseLeave={handleCanvasMouseLeave}
                    className="relative min-h-0 flex-1 overflow-x-auto overflow-y-hidden py-4"
                >
                    {/* Live Cursors Layer */}
                    <LiveCursors cursors={Object.values(remoteCursors)} />

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
                                onAddStarterColumns={handleAddStarterColumns}
                                isCreatingStarters={isCreatingStarters}
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
                                boardId={board.id}
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
                                                key={list.id}
                                                list={list}
                                                tasks={visibleTasks}
                                                totalTasks={listTasks.length}
                                                onAddTask={() => setCreateTaskList(list)}
                                                onRename={() => setEditingList(list)}
                                                onDelete={() => setDeletingList(list)}
                                                onViewTask={(task) => {
                                                    setSelectedTask(task);
                                                }}
                                                onEditTask={(task) => {
                                                    setEditingTask(task);
                                                }}
                                                onDeleteTask={(task) => {
                                                    setDeletingTask(task);
                                                }}
                                                onCompletedChange={handleCompletedChange}
                                                remoteDraggingMap={remoteDraggingMap}
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
            )}

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
                        setCalendarNewTaskDate(undefined);
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
                boardId={board.id}
                workspaceMembers={workspaceMembers}
                initialDueDate={calendarNewTaskDate}
                onCreated={async () => {
                    await loadTasks(
                        lists,
                    );
                }}
            />

            {/* Edit task */}
            {/* Task dialogs */}

            <EditTaskDialog
                task={editingTask}
                boardId={board.id}
                workspaceMembers={workspaceMembers}
                open={editingTask !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditingTask(null);
                    }
                }}
                onLabelsChange={(labels) => {
                    setEditingTask((current) =>
                        current
                            ? {
                                ...current,
                                labels,
                            }
                            : null
                    );
                }}
                onSave={handleUpdateTask}
            />
            <TaskDetailsDialog
                task={selectedTask}
                boardId={board.id}
                workspaceMembers={workspaceMembers}
                open={selectedTask !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedTask(null);
                    }
                }}
                onLabelsChange={(labels) => {
                    setSelectedTask((current) =>
                        current
                            ? {
                                ...current,
                                labels,
                            }
                            : null
                    );
                }}
                onEdit={() => {
                    const task = selectedTask;
                    setSelectedTask(null);
                    setEditingTask(task);
                }}
                onDelete={() => {
                    const task = selectedTask;
                    setSelectedTask(null);
                    setDeletingTask(task);
                }}
                onTaskUpdate={handleTaskUpdatedFromDialog}
            />

            {!selectedTask && (
                <DeleteTaskDialog
                    task={deletingTask}
                    open={deletingTask !== null}
                    onOpenChange={(open) => {
                        if (!open) {
                            setDeletingTask(null);
                        }
                    }}
                    onConfirm={handleDeleteTask}
                />
            )}
        </div>
    );
}