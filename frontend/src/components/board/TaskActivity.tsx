import { useState, useEffect } from "react";
import { activityApi } from "@/api/activity.api";

export default function TaskActivity({ taskId }: { taskId: string }) {
    const [activities, setActivities] = useState<Awaited<ReturnType<typeof activityApi.getTaskActivity>>>([]);

    useEffect(() => {
        loadActivities();
    }, [taskId]);

    const loadActivities = async () => {
        try {
            const data = await activityApi.getTaskActivity(taskId);
            setActivities(data);
        } catch (error) {
            console.error("Failed to load activity", error);
        }
    };

    const formatAction = (action: string, entityType: string, title: string) => {
        const actionText = action.toLowerCase();
        const entityText = entityType.toLowerCase();
        return `${actionText} ${entityText} "${title}"`;
    };

    return (
        <div className="space-y-4">
            <h4 className="text-sm font-medium">Activity Log</h4>
            <div className="space-y-3">
                {activities.length === 0 && (
                    <p className="text-sm italic text-muted-foreground">No activity yet.</p>
                )}
                {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-2 text-sm items-start">
                        <div className="mt-0.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                        <div className="flex-1">
                            <span className="font-medium">{activity.user.name}</span>{" "}
                            <span className="text-muted-foreground">
                                {formatAction(activity.action, activity.entityType, activity.entityTitle)}
                            </span>
                            <div className="text-xs text-muted-foreground mt-0.5">
                                {new Date(activity.createdAt).toLocaleString()}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
