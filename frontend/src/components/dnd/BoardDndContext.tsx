import {
    DndContext,
    DragOverlay,
    PointerSensor,
    MouseSensor,
    TouchSensor,
    closestCenter,
    useSensor,
    useSensors,
    defaultDropAnimationSideEffects,
    type DropAnimation,
    type DragEndEvent,
    type DragStartEvent,
    type DragOverEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import {
    useState,
    useRef,
    type Dispatch,
    type ReactNode,
    type SetStateAction,
} from "react";
import type { Task } from "@/api/task.api";

interface BoardDndContextProps {
    tasks: Record<string, Task[]>;
    onTasksChange: Dispatch<SetStateAction<Record<string, Task[]>>>;
    onMoveTask: (taskId: string, listId: string, position: number) => Promise<Task>;
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
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const originalTasks = useRef<Record<string, Task[]> | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    );

    const dropAnimation: DropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: { active: { opacity: "0" } },
        }),
    };

    const findTaskLocation = (taskId: string, tasksToSearch = tasks) => {
        for (const [listId, listTasks] of Object.entries(tasksToSearch)) {
            const index = listTasks.findIndex((task) => task.id === taskId);
            if (index !== -1) {
                return { listId, index, task: listTasks[index] };
            }
        }
        return null;
    };

    const findTargetList = (overId: string): string | null => {
        if (Object.prototype.hasOwnProperty.call(tasks, overId)) return overId;
        for (const [listId, listTasks] of Object.entries(tasks)) {
            if (listTasks.some((task) => task.id === overId)) return listId;
        }
        return null;
    };

    const handleDragStart = (event: DragStartEvent) => {
        if (disabled) return;
        const taskId = String(event.active.id);
        const location = findTaskLocation(taskId);
        if (location?.task) {
            setActiveTask(location.task);
            originalTasks.current = tasks;
        }
    };

    const handleDragCancel = () => {
        setActiveTask(null);
        if (originalTasks.current) {
            onTasksChange(originalTasks.current);
            originalTasks.current = null;
        }
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = String(active.id);
        const overId = String(over.id);

        if (activeId === overId) return;

        const activeLocation = findTaskLocation(activeId);
        const overListId = findTargetList(overId);

        if (!activeLocation || !overListId) return;

        // If crossing lists, update state immediately for the preview ghost to follow
        if (activeLocation.listId !== overListId) {
            onTasksChange((prev) => {
                const activeItems = prev[activeLocation.listId] || [];
                const overItems = prev[overListId] || [];
                const activeIndex = activeItems.findIndex(t => t.id === activeId);
                const overIndex = overId === overListId 
                    ? overItems.length 
                    : overItems.findIndex(t => t.id === overId);

                let newIndex;
                if (overId === overListId) {
                    newIndex = overItems.length;
                } else {
                    const isBelowOverItem =
                        over &&
                        active.rect.current.translated &&
                        active.rect.current.translated.top > over.rect.top + over.rect.height / 2;
                    newIndex = overIndex >= 0 ? overIndex + (isBelowOverItem ? 1 : 0) : overItems.length;
                }

                const newActiveItems = [...activeItems];
                const [movedItem] = newActiveItems.splice(activeIndex, 1);
                const newOverItems = [...overItems];
                newOverItems.splice(newIndex, 0, { ...movedItem, listId: overListId });

                return {
                    ...prev,
                    [activeLocation.listId]: newActiveItems,
                    [overListId]: newOverItems,
                };
            });
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        setActiveTask(null);
        if (disabled) return;

        const { active, over } = event;
        if (!over) {
            if (originalTasks.current) {
                onTasksChange(originalTasks.current);
                originalTasks.current = null;
            }
            return;
        }

        const activeId = String(active.id);
        const overId = String(over.id);

        const activeLocation = findTaskLocation(activeId);
        const targetListId = findTargetList(overId);

        if (!activeLocation || !targetListId) return;

        const originalLocation = originalTasks.current ? findTaskLocation(activeId, originalTasks.current) : null;
        
        let finalIndex = activeLocation.index;
        
        // Only perform arrayMove if it's a same-list shift during drop.
        // For cross-list, onDragOver already placed it.
        if (activeId !== overId) {
            const targetTasks = tasks[targetListId] ?? [];
            const overIndex = targetTasks.findIndex((task) => task.id === overId);
            
            if (overIndex !== -1) {
                finalIndex = overIndex;
                const newTargetTasks = arrayMove(targetTasks, activeLocation.index, overIndex);
                
                onTasksChange((current) => ({
                    ...current,
                    [targetListId]: newTargetTasks.map((t, i) => ({ ...t, position: i })),
                }));
            }
        } else {
             // We dropped on the exact placeholder or list
             onTasksChange((current) => ({
                 ...current,
                 [targetListId]: (current[targetListId] ?? []).map((t, i) => ({ ...t, position: i })),
             }));
        }

        const hasMoved = activeLocation.index !== finalIndex || activeLocation.listId !== originalLocation?.listId;
        const rollbackState = originalTasks.current;
        originalTasks.current = null;

        try {
            if (hasMoved) {
                await onMoveTask(activeId, targetListId, finalIndex);
            }
        } catch (error) {
            console.error("Failed to move task:", error);
            if (rollbackState) {
                onTasksChange(rollbackState);
            }
        }
    };

    if (disabled) return <>{children}</>;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            {children}
            <DragOverlay dropAnimation={dropAnimation}>
                {activeTask ? (
                    <div
                        className="w-[280px] cursor-grabbing rounded-lg border bg-background p-3"
                        style={{ boxShadow: "0 16px 40px -8px rgba(0,0,0,0.25), 0 4px 12px -4px rgba(0,0,0,0.15)" }}
                    >
                        <div className="flex items-start gap-2">
                            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border opacity-40" />
                            <div className="min-w-0 flex-1">
                                <h3 className="text-sm font-medium leading-5">{activeTask.title}</h3>
                                {activeTask.description && (
                                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                                        {activeTask.description}
                                    </p>
                                )}
                                {activeTask.labels.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        {activeTask.labels.map((label) => (
                                            <span
                                                key={label.id}
                                                className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                                                style={{ backgroundColor: label.color }}
                                            >
                                                {label.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
