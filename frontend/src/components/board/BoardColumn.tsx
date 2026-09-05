import {
    Circle,
    MoreHorizontal,
    Pencil,
    Plus,
    Trash2,
} from "lucide-react";

import { useDroppable } from "@dnd-kit/core";

import type { BoardList } from "@/api/list.api";
import type { Task } from "@/api/task.api";

import { Button } from "@/components/ui/button";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import TaskList from "./TaskList";

interface BoardColumnProps {
    list: BoardList;
    tasks: Task[];
    totalTasks: number;
    onAddTask: () => void;
    onRename: () => void;
    onDelete: () => void;
    onEditTask: (task: Task) => void;
    onDeleteTask: (task: Task) => void;
}

export default function BoardColumn({
    list,
    tasks,
    totalTasks,
    onAddTask,
    onRename,
    onDelete,
    onEditTask,
    onDeleteTask,
}: BoardColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: list.id,
    });

    return (
        <section className="flex min-w-[280px] flex-1 flex-col rounded-xl border bg-muted/30">

            {/* Header */}
            <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">

                <div className="flex min-w-0 items-center gap-2">

                    <Circle className="h-3.5 w-3.5 shrink-0" />

                    <h2 className="truncate text-sm font-semibold">
                        {list.name}
                    </h2>

                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {totalTasks}
                    </span>

                </div>

                <div className="flex items-center">

                    {/* Add task */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={onAddTask}
                        title="Add task"
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
                                title="List options"
                            >
                                <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">

                            <DropdownMenuItem
                                onClick={onRename}
                            >
                                <Pencil className="mr-2 h-4 w-4" />
                                Rename list
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                                onClick={onDelete}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete list
                            </DropdownMenuItem>

                        </DropdownMenuContent>
                    </DropdownMenu>

                </div>
            </div>

            {/* Tasks */}
            <div
                ref={setNodeRef}
                className={`min-h-0 flex-1 overflow-y-auto p-3 transition-colors ${
                    isOver ? "bg-muted/50" : ""
                }`}
            >
                {tasks.length === 0 ? (
                    <div className="flex min-h-[180px] flex-col items-center justify-center rounded-lg border border-dashed bg-background/40 px-5 text-center">

                        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                            <Plus className="h-4 w-4 text-muted-foreground" />
                        </div>

                        <p className="text-sm font-medium">
                            {totalTasks > 0
                                ? "No matching tasks"
                                : `No tasks in ${list.name}`}
                        </p>

                        <p className="mt-1 max-w-[200px] text-xs leading-relaxed text-muted-foreground">
                            {totalTasks > 0
                                ? "Try changing your search."
                                : "Add a task to start organizing work here."}
                        </p>

                        {totalTasks === 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2 h-8"
                                onClick={onAddTask}
                            >
                                <Plus className="mr-1.5 h-3.5 w-3.5" />
                                Add task
                            </Button>
                        )}

                    </div>
                ) : (
                    <TaskList
                        tasks={tasks}
                        onEdit={onEditTask}
                        onDelete={onDeleteTask}
                    />
                )}
            </div>

            {/* Bottom Add Task */}
            <div className="shrink-0 border-t p-2">

                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-full justify-start text-muted-foreground hover:text-foreground"
                    onClick={onAddTask}
                >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add task
                </Button>

            </div>

        </section>
    );
}