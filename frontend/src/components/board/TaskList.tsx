import type { Task } from "@/api/task.api";

import TaskCard from "./TaskCard";

interface TaskListProps {
    tasks: Task[];
    onEdit: (task: Task) => void;
    onDelete: (task: Task) => void;
}

export default function TaskList({
    tasks,
    onEdit,
    onDelete,
}: TaskListProps) {
    if (tasks.length === 0) {
        return null;
    }

    return (
        <div className="space-y-2">
            {tasks.map((task) => (
                <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={() => onEdit(task)}
                    onDelete={() => onDelete(task)}
                />
            ))}
        </div>
    );
}