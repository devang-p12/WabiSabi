
import {
    DndContext,
    DragOverlay,
    closestCorners,
    type DragEndEvent,
    type DragStartEvent,
} from "@dnd-kit/core";

import { useState, type Dispatch, type ReactNode, type SetStateAction } from "react";

import type { Task } from "@/api/task.api";

interface BoardDndContextProps {
    tasks: Record<string, Task[]>;
    onTasksChange: Dispatch<
        SetStateAction<Record<string, Task[]>>
    >;
    onMoveTask: (
        taskId: string,
        listId: string,
        position: number,
    ) => Promise<Task>;
    children: ReactNode;
    disabled?: boolean;
}

export default function BoardDndContext({
    tasks,
    onTasksChange,
    onMoveTask,
    children,
    disabled = false,
}: BoardDndContextProps) {
    const [activeTask, setActiveTask] =
        useState<Task | null>(null);

    const handleDragStart = (
        event: DragStartEvent,
    ) => {
        if (disabled) {
            return;
        }

        const taskId = String(event.active.id);

        for (const listTasks of Object.values(tasks)) {
            const task = listTasks.find(
                (item) => item.id === taskId,
            );

            if (task) {
                setActiveTask(task);
                return;
            }
        }
    };

    const handleDragCancel = () => {
        setActiveTask(null);
    };

    const handleDragEnd = async (
        event: DragEndEvent,
    ) => {
        setActiveTask(null);

        if (disabled) {
            return;
        }

        const { active, over } = event;

        if (!over) {
            return;
        }

        const taskId = String(active.id);
        const overId = String(over.id);

        /*
         * Find source list and task.
         */
        let sourceListId: string | null = null;
        let sourceTask: Task | null = null;

        for (const [listId, listTasks] of Object.entries(
            tasks,
        )) {
            const foundTask = listTasks.find(
                (task) => task.id === taskId,
            );

            if (foundTask) {
                sourceListId = listId;
                sourceTask = foundTask;
                break;
            }
        }

        if (!sourceListId || !sourceTask) {
            return;
        }

        /*
         * Find target list.
         *
         * overId can be either:
         * - a list ID
         * - a task ID
         */
        let targetListId: string | null = null;

        if (
            Object.prototype.hasOwnProperty.call(
                tasks,
                overId,
            )
        ) {
            targetListId = overId;
        } else {
            for (const [listId, listTasks] of Object.entries(
                tasks,
            )) {
                if (
                    listTasks.some(
                        (task) => task.id === overId,
                    )
                ) {
                    targetListId = listId;
                    break;
                }
            }
        }

        if (!targetListId) {
            return;
        }

        const sourceTasks =
            tasks[sourceListId] ?? [];

        const targetTasks =
            tasks[targetListId] ?? [];

        /*
         * Determine target position.
         */
        let targetPosition = targetTasks.length;

        if (overId !== targetListId) {
            const overIndex =
                targetTasks.findIndex(
                    (task) => task.id === overId,
                );

            if (overIndex !== -1) {
                targetPosition = overIndex;
            }
        }

        /*
         * Same-list reorder.
         */
        if (sourceListId === targetListId) {
            const currentIndex =
                sourceTasks.findIndex(
                    (task) => task.id === taskId,
                );

            if (currentIndex === -1) {
                return;
            }

            if (currentIndex === targetPosition) {
                return;
            }

            const reorderedTasks = [
                ...sourceTasks,
            ];

            const [movedTask] =
                reorderedTasks.splice(
                    currentIndex,
                    1,
                );

            if (!movedTask) {
                return;
            }

            /*
             * Removing the task shifts the index
             * when moving downward.
             */
            if (targetPosition > currentIndex) {
                targetPosition -= 1;
            }

            reorderedTasks.splice(
                targetPosition,
                0,
                movedTask,
            );

            const updatedTasks =
                reorderedTasks.map(
                    (task, index) => ({
                        ...task,
                        position: index,
                    }),
                );

            /*
             * Optimistic update.
             */
            onTasksChange((current) => ({
                ...current,
                [sourceListId!]:
                    updatedTasks,
            }));

            try {
                await onMoveTask(
                    taskId,
                    targetListId,
                    targetPosition,
                );
            } catch (error) {
                console.error(
                    "Failed to move task:",
                    error,
                );

                /*
                 * Roll back.
                 */
                onTasksChange((current) => ({
                    ...current,
                    [sourceListId!]:
                        sourceTasks,
                }));
            }

            return;
        }

        /*
         * Move between lists.
         */
        const newSourceTasks =
            sourceTasks.filter(
                (task) => task.id !== taskId,
            );

        const newTargetTasks = [
            ...targetTasks,
        ];

        newTargetTasks.splice(
            targetPosition,
            0,
            {
                ...sourceTask,
                listId: targetListId,
            },
        );

        const updatedSourceTasks =
            newSourceTasks.map(
                (task, index) => ({
                    ...task,
                    position: index,
                }),
            );

        const updatedTargetTasks =
            newTargetTasks.map(
                (task, index) => ({
                    ...task,
                    listId: targetListId!,
                    position: index,
                }),
            );

        /*
         * Optimistic update.
         */
        onTasksChange((current) => ({
            ...current,
            [sourceListId!]:
                updatedSourceTasks,
            [targetListId!]:
                updatedTargetTasks,
        }));

        try {
            await onMoveTask(
                taskId,
                targetListId,
                targetPosition,
            );
        } catch (error) {
            console.error(
                "Failed to move task:",
                error,
            );

            /*
             * Roll back both lists.
             */
            onTasksChange((current) => ({
                ...current,
                [sourceListId!]:
                    sourceTasks,
                [targetListId!]:
                    targetTasks,
            }));
        }
    };

    /*
     * When DnD is disabled, don't create a DnD context.
     * This is useful while searching or using another
     * sorting mode.
     */
    if (disabled) {
        return <>{children}</>;
    }

    return (
        <DndContext
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            {children}

            <DragOverlay>
                {activeTask ? (
                    <div className="w-[280px] rotate-2 cursor-grabbing rounded-lg border bg-background p-3 shadow-xl">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                                <h3 className="text-sm font-medium leading-5">
                                    {activeTask.title}
                                </h3>

                                {activeTask.description && (
                                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                                        {
                                            activeTask.description
                                        }
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">
                                #
                                {activeTask.id.slice(
                                    0,
                                    6,
                                )}
                            </span>

                            <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                        </div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
