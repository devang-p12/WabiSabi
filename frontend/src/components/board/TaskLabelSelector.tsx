import { useEffect, useState } from "react";
import {
    addLabelToTask,
    getBoardLabels,
    removeLabelFromTask,
    type Label,
} from "@/api/label.api";
import type { Task } from "@/api/task.api";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, X } from "lucide-react";

interface TaskLabelSelectorProps {
    task: Task;
    boardId: string;
    onLabelsChange?: (labels: Label[]) => void;
}

export default function TaskLabelSelector({
    task,
    boardId,
    onLabelsChange,
}: TaskLabelSelectorProps) {
    const [boardLabels, setBoardLabels] = useState<Label[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchLabels = async () => {
            try {
                setLoading(true);

                const labels = await getBoardLabels(boardId);

                setBoardLabels(labels);
            } catch (error) {
                console.error(
                    "Failed to fetch board labels:",
                    error
                );
            } finally {
                setLoading(false);
            }
        };

        fetchLabels();
    }, [boardId]);

    const handleAddLabel = async (label: Label) => {
        try {
            await addLabelToTask(task.id, label.id);

            const updatedLabels = [
                ...task.labels,
                label,
            ];

            onLabelsChange?.(updatedLabels);
        } catch (error) {
            console.error(
                "Failed to add label to task:",
                error
            );
        }
    };

    const handleRemoveLabel = async (label: Label) => {
        try {
            await removeLabelFromTask(
                task.id,
                label.id
            );

            const updatedLabels = task.labels.filter(
                (item) => item.id !== label.id
            );

            onLabelsChange?.(updatedLabels);
        } catch (error) {
            console.error(
                "Failed to remove label from task:",
                error
            );
        }
    };

    const assignedLabelIds = new Set(
        task.labels.map((label) => label.id)
    );

    const availableLabels = boardLabels.filter(
        (label) => !assignedLabelIds.has(label.id)
    );

    return (
        <div className="flex flex-wrap items-center gap-2">
            {task.labels.map((label) => (
                <Badge
                    key={label.id}
                    className="gap-1"
                    style={{
                        backgroundColor: label.color,
                        color: "#fff",
                    }}
                >
                    {label.name}

                    <button
                        type="button"
                        onClick={() =>
                            handleRemoveLabel(label)
                        }
                        className="ml-1 rounded-full hover:bg-black/20"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </Badge>
            ))}

            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={loading}
                    >
                        <Plus className="mr-1 h-3 w-3" />
                        Label
                    </Button>
                </PopoverTrigger>

                <PopoverContent
                    className="w-56 p-2"
                    align="start"
                >
                    {availableLabels.length === 0 ? (
                        <p className="p-2 text-sm text-muted-foreground">
                            No more labels available
                        </p>
                    ) : (
                        <div className="space-y-1">
                            {availableLabels.map((label) => (
                                <button
                                    key={label.id}
                                    type="button"
                                    onClick={() =>
                                        handleAddLabel(
                                            label
                                        )
                                    }
                                    className="flex w-full items-center gap-2 rounded-md p-2 text-left text-sm hover:bg-muted"
                                >
                                    <span
                                        className="h-3 w-3 rounded-full"
                                        style={{
                                            backgroundColor:
                                                label.color,
                                        }}
                                    />

                                    {label.name}
                                </button>
                            ))}
                        </div>
                    )}
                </PopoverContent>
            </Popover>
        </div>
    );
}