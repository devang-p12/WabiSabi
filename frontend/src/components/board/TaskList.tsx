import type { Task } from "@/api/task.api";

import {
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import TaskCard from "./TaskCard";

interface TaskListProps {
    tasks: Task[];
    onView: (task: Task) => void;
    onEdit: (task: Task) => void;
    onDelete: (task: Task) => void;
    onCompletedChange: (task: Task) => void;
    remoteDraggingMap?: Record<string, { userName: string; color: string }>;
}


export default function TaskList({
    tasks,
    onView,
    onEdit,
    onDelete,
    onCompletedChange,
    remoteDraggingMap,
}: TaskListProps) {
    if (tasks.length === 0) {
        return null;
    }

    return (
        <SortableContext
            items={tasks.map((task) => task.id)}
            strategy={verticalListSortingStrategy}
        >
            <div className="space-y-2">
                {tasks.map((task) => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        onView={() => onView(task)}
                        onEdit={() => onEdit(task)}
                        onDelete={() => onDelete(task)}
                        onCompletedChange={onCompletedChange}
                        remoteDraggingInfo={remoteDraggingMap?.[task.id]}
                    />
                ))}
            </div>
        </SortableContext>
    );
}