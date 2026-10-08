import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, MessageSquare, UserPlus, AtSign, Clock, X } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default function NotificationToastAlert() {
    const { recentAlert, dismissAlert, markAsRead } = useNotifications();
    const [visible, setVisible] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (recentAlert) {
            setVisible(true);
        } else {
            setVisible(false);
        }
    }, [recentAlert]);

    if (!recentAlert || !visible) return null;

    const handleAction = async () => {
        await markAsRead(recentAlert.id);
        if (recentAlert.workspaceId && recentAlert.boardId) {
            navigate(`/workspaces/${recentAlert.workspaceId}/boards/${recentAlert.boardId}`);
        } else if (recentAlert.workspaceId) {
            navigate(`/workspaces/${recentAlert.workspaceId}`);
        }
        dismissAlert();
    };

    const initials = recentAlert.actor?.name
        ? recentAlert.actor.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
        : "WS";

    const getIcon = () => {
        switch (recentAlert.type) {
            case "TASK_ASSIGNED":
                return <UserPlus className="h-3.5 w-3.5 text-indigo-500" />;
            case "TASK_COMMENT":
                return <MessageSquare className="h-3.5 w-3.5 text-blue-500" />;
            case "TASK_MENTION":
                return <AtSign className="h-3.5 w-3.5 text-emerald-500" />;
            case "TASK_DUE_SOON":
                return <Clock className="h-3.5 w-3.5 text-amber-500" />;
            default:
                return <Bell className="h-3.5 w-3.5 text-primary" />;
        }
    };

    return (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card/95 text-card-foreground shadow-xl backdrop-blur-md ring-1 ring-black/5 dark:ring-white/10">
                <div className="relative shrink-0">
                    <Avatar className="h-9 w-9">
                        {recentAlert.actor?.avatarUrl && (
                            <AvatarImage src={recentAlert.actor.avatarUrl} alt={recentAlert.actor.name} />
                        )}
                        <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-background shadow-xs border border-border">
                        {getIcon()}
                    </div>
                </div>

                <div className="min-w-0 flex-1 cursor-pointer" onClick={handleAction}>
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold tracking-wide text-foreground">
                            {recentAlert.title}
                        </span>
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {recentAlert.message}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                        <span className="text-[11px] font-medium text-primary hover:underline">
                            View details →
                        </span>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full hover:bg-muted"
                        onClick={dismissAlert}
                        title="Dismiss"
                    >
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
