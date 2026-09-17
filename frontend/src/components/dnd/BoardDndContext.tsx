import {
    DndContext,
    DragOverlay,
    closestCenter,
    type DragEndEvent,
    type DragStartEvent,
} from "@dnd-kit/core";

import {
    useState,
    type Dispatch,
    type ReactNode,
    type SetStateAction,
} from "react";

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

    /**
     * Find the list containing a task.
     */
    const findTaskLocation = (
        taskId: string,
    ) => {
        for (const [
            listId,
            listTasks,
        ] of Object.entries(tasks)) {
            const index = listTasks.findIndex(
                (task) => task.id === taskId,
            );

            if (index !== -1) {
                return {
                    listId,
                    index,
                    task: listTasks[index],
                };
            }
        }

        return null;
    };

    /**
     * Find which list an over element belongs to.
     *
     * `over.id` can be either:
     * - a list ID
     * - a task ID
     */
    const findTargetList = (
        overId: string,
    ): string | null => {
        // Dropped directly over a list.
        if (
            Object.prototype.hasOwnProperty.call(
                tasks,
                overId,
            )
        ) {
            return overId;
        }

        // Dropped over a task.
        for (const [
            listId,
            listTasks,
        ] of Object.entries(tasks)) {
            if (
                listTasks.some(
                    (task) =>
                        task.id === overId,
                )
            ) {
                return listId;
            }
        }

        return null;
    };

    /**
     * Drag started.
     */
    const handleDragStart = (
        event: DragStartEvent,
    ) => {
        if (disabled) {
            return;
        }

        const taskId = String(
            event.active.id,
        );

        const location =
            findTaskLocation(taskId);

        if (location?.task) {
            setActiveTask(location.task);
        }
    };

    /**
     * Drag cancelled.
     */
    const handleDragCancel = () => {
        setActiveTask(null);
    };

    /**
     * Drag ended.
     */
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

        // Find the task being dragged.
        const source = findTaskLocation(taskId);

        if (!source) {
            return;
        }

        // Find the target list.
        const targetListId =
            findTargetList(overId);

        if (!targetListId) {
            return;
        }

        const sourceListId = source.listId;

        const sourceTasks =
            tasks[sourceListId] ?? [];

        const targetTasks =
            tasks[targetListId] ?? [];

        /*
         * ==========================================
         * SAME LIST
         * ==========================================
         */
        if (sourceListId === targetListId) {
            const oldIndex = source.index;

            const overIndex =
                targetTasks.findIndex(
                    (task) => task.id === overId,
                );

            /*
             * If we are over the list itself,
             * don't change anything.
             */
            if (overIndex === -1) {
                return;
            }

            /*
             * Get the vertical position of the
             * target card.
             */
            const overRect =
                over.rect;

            const overMiddleY =
                overRect.top +
                overRect.height / 2;

            /*
             * `active.rect.current.translated`
             * gives us the dragged card's current
             * position.
             */
            const activeRect =
                active.rect.current
                    .translated;

            if (!activeRect) {
                return;
            }

            const activeMiddleY =
                activeRect.top +
                activeRect.height / 2;

            /*
             * Decide whether the task should go
             * before or after the target.
             */
            let newIndex = overIndex;

            if (
                activeMiddleY >
                overMiddleY
            ) {
                newIndex =
                    overIndex + 1;
            }

            /*
             * The dragged item is currently still
             * included in the array, so remove it
             * before calculating the final position.
             */
            const reorderedTasks = [
                ...sourceTasks,
            ];

            const [
                movedTask,
            ] = reorderedTasks.splice(
                oldIndex,
                1,
            );

            if (!movedTask) {
                return;
            }

            /*
             * If the item was removed from before
             * the insertion point, the insertion
             * index shifts left by one.
             */
            if (oldIndex < newIndex) {
                newIndex--;
            }

            /*
             * Keep the index inside the array.
             */
            newIndex = Math.max(
                0,
                Math.min(
                    newIndex,
                    reorderedTasks.length,
                ),
            );

            /*
             * Nothing changed.
             */
            if (oldIndex === newIndex) {
                return;
            }

            reorderedTasks.splice(
                newIndex,
                0,
                movedTask,
            );

            /*
             * Recalculate positions.
             */
            const updatedTasks =
                reorderedTasks.map(
                    (task, index) => ({
                        ...task,
                        position: index,
                    }),
                );

            const previousTasks =
                sourceTasks;

            /*
             * Optimistic update.
             */
            onTasksChange(
                (current) => ({
                    ...current,
                    [sourceListId]:
                        updatedTasks,
                }),
            );

            try {
                await onMoveTask(
                    taskId,
                    targetListId,
                    newIndex,
                );
            } catch (error) {
                console.error(
                    "Failed to move task:",
                    error,
                );

                /*
                 * Rollback.
                 */
                onTasksChange(
                    (current) => ({
                        ...current,
                        [sourceListId]:
                            previousTasks,
                    }),
                );
            }

            return;
        }

        /*
         * ==========================================
         * CROSS LIST
         * ==========================================
         */

        const newSourceTasks =
            sourceTasks.filter(
                (task) =>
                    task.id !== taskId,
            );

        const newTargetTasks = [
            ...targetTasks,
        ];

        let targetIndex =
            targetTasks.findIndex(
                (task) => task.id === overId,
            );

        /*
         * Dropped directly onto the list
         * instead of a task -> append.
         */
        if (targetIndex === -1) {
            targetIndex =
                targetTasks.length;
        } else {
            /*
             * Determine whether we're dropping
             * above or below the target task.
             */
            const overRect =
                over.rect;

            const overMiddleY =
                overRect.top +
                overRect.height / 2;

            const activeRect =
                active.rect.current
                    .translated;

            if (activeRect) {
                const activeMiddleY =
                    activeRect.top +
                    activeRect.height / 2;

                if (
                    activeMiddleY >
                    overMiddleY
                ) {
                    targetIndex++;
                }
            }
        }

        /*
         * Keep index valid.
         */
        targetIndex = Math.max(
            0,
            Math.min(
                targetIndex,
                newTargetTasks.length,
            ),
        );

        /*
         * Insert dragged task.
         */
        newTargetTasks.splice(
            targetIndex,
            0,
            {
                ...source.task,
                listId: targetListId,
            },
        );

        /*
         * Recalculate source positions.
         */
        const updatedSourceTasks =
            newSourceTasks.map(
                (task, index) => ({
                    ...task,
                    position: index,
                }),
            );

        /*
         * Recalculate target positions.
         */
        const updatedTargetTasks =
            newTargetTasks.map(
                (task, index) => ({
                    ...task,
                    listId: targetListId,
                    position: index,
                }),
            );

        const previousSourceTasks =
            sourceTasks;

        const previousTargetTasks =
            targetTasks;

        /*
         * Optimistic update.
         */
        onTasksChange(
            (current) => ({
                ...current,

                [sourceListId]:
                    updatedSourceTasks,

                [targetListId]:
                    updatedTargetTasks,
            }),
        );

        try {
            await onMoveTask(
                taskId,
                targetListId,
                targetIndex,
            );
        } catch (error) {
            console.error(
                "Failed to move task:",
                error,
            );

            /*
             * Rollback.
             */
            onTasksChange(
                (current) => ({
                    ...current,

                    [sourceListId]:
                        previousSourceTasks,

                    [targetListId]:
                        previousTargetTasks,
                }),
            );
        }
    };

    /**
     * When DnD is disabled,
     * render children normally.
     */
    if (disabled) {
        return <>{children}</>;
    }

    return (
        <DndContext
            collisionDetection={
                closestCenter
            }
            onDragStart={
                handleDragStart
            }
            onDragEnd={
                handleDragEnd
            }
            onDragCancel={
                handleDragCancel
            }
        >
            {children}

            <DragOverlay>
                {activeTask ? (
                    <div className="w-[280px] rotate-2 cursor-grabbing rounded-lg border bg-background p-3 shadow-xl">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                                <h3 className="text-sm font-medium leading-5">
                                    {
                                        activeTask.title
                                    }
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