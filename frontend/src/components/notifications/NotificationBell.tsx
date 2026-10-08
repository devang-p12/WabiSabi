import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Bell,
    Check,
    CheckCheck,
    Clock,
    Inbox,
    MessageSquare,
    Trash2,
    UserPlus,
    AtSign,
} from "lucide-react";
import { useNotifications } from "@/contexts/NotificationContext";
import type { AppNotification } from "@/api/notification.api";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "cn";

function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 45) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function NotificationBell() {
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
    } = useNotifications();

    const [open, setOpen] = useState(false);
    const [filter, setFilter] = useState<"all" | "unread">("all");
    const navigate = useNavigate();

    const filteredNotifications = notifications.filter((notif) => {
        if (filter === "unread") return !notif.read;
        return true;
    });

    const handleItemClick = async (notif: AppNotification) => {
        if (!notif.read) {
            await markAsRead(notif.id);
        }
        setOpen(false);

        if (notif.workspaceId && notif.boardId) {
            navigate(`/workspaces/${notif.workspaceId}/boards/${notif.boardId}`);
        } else if (notif.workspaceId) {
            navigate(`/workspaces/${notif.workspaceId}`);
        }
    };

    const getIconForType = (type: AppNotification["type"]) => {
        switch (type) {
            case "TASK_ASSIGNED":
                return <UserPlus className="h-3 w-3 text-indigo-500" />;
            case "TASK_COMMENT":
                return <MessageSquare className="h-3 w-3 text-blue-500" />;
            case "TASK_MENTION":
                return <AtSign className="h-3 w-3 text-emerald-500" />;
            case "TASK_DUE_SOON":
                return <Clock className="h-3 w-3 text-amber-500" />;
            default:
                return <Bell className="h-3 w-3 text-primary" />;
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                    title="Notifications"
                >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-xs animate-in zoom-in-50">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent
                align="end"
                side="bottom"
                sideOffset={8}
                className="w-80 sm:w-96 p-0 overflow-hidden border border-border bg-popover/95 backdrop-blur-md shadow-2xl rounded-xl ring-1 ring-black/5"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/30">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold tracking-tight text-foreground">
                            Notifications
                        </span>
                        {unreadCount > 0 && (
                            <Badge
                                variant="secondary"
                                className="text-[10px] h-5 px-1.5 font-medium bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                            >
                                {unreadCount} new
                            </Badge>
                        )}
                    </div>

                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAllAsRead()}
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                            <CheckCheck className="mr-1 h-3.5 w-3.5" />
                            Mark all read
                        </Button>
                    )}
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 border-b px-3 py-1.5 bg-muted/10 text-xs">
                    <button
                        onClick={() => setFilter("all")}
                        className={cn(
                            "rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer",
                            filter === "all"
                                ? "bg-background text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        All ({notifications.length})
                    </button>
                    <button
                        onClick={() => setFilter("unread")}
                        className={cn(
                            "rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer",
                            filter === "unread"
                                ? "bg-background text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Unread ({unreadCount})
                    </button>
                </div>

                {/* Notifications List */}
                <div className="max-h-[380px] overflow-y-auto divide-y divide-border/50">
                    {filteredNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 mb-2">
                                <Inbox className="h-6 w-6 stroke-1 text-muted-foreground" />
                            </div>
                            <p className="text-xs font-medium text-foreground">
                                {filter === "unread"
                                    ? "No unread notifications"
                                    : "No notifications yet"}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                When team members assign tasks or mention you, updates will show up here.
                            </p>
                        </div>
                    ) : (
                        filteredNotifications.map((notif) => {
                            const initials = notif.actor?.name
                                ? notif.actor.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .toUpperCase()
                                      .slice(0, 2)
                                : "WS";

                            return (
                                <div
                                    key={notif.id}
                                    onClick={() => handleItemClick(notif)}
                                    className={cn(
                                        "group relative flex items-start gap-3 p-3 transition-colors cursor-pointer hover:bg-muted/40",
                                        !notif.read && "bg-primary/[0.04]"
                                    )}
                                >
                                    {/* Unread indicator */}
                                    <div className="pt-2">
                                        <span
                                            className={cn(
                                                "block h-2 w-2 rounded-full",
                                                !notif.read ? "bg-blue-500" : "bg-transparent"
                                            )}
                                        />
                                    </div>

                                    {/* Actor Avatar with Type Badge */}
                                    <div className="relative shrink-0">
                                        <Avatar className="h-8 w-8">
                                            {notif.actor?.avatarUrl && (
                                                <AvatarImage src={notif.actor.avatarUrl} alt={notif.actor.name} />
                                            )}
                                            <AvatarFallback className="text-[10px] font-semibold bg-muted text-foreground">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-background border border-border shadow-xs">
                                            {getIconForType(notif.type)}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-baseline justify-between gap-1">
                                            <p
                                                className={cn(
                                                    "text-xs truncate",
                                                    !notif.read
                                                        ? "font-semibold text-foreground"
                                                        : "font-medium text-muted-foreground"
                                                )}
                                            >
                                                {notif.title}
                                            </p>
                                            <span className="shrink-0 text-[10px] text-muted-foreground">
                                                {formatRelativeTime(notif.createdAt)}
                                            </span>
                                        </div>

                                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                                            {notif.message}
                                        </p>
                                    </div>

                                    {/* Hover Actions */}
                                    <div
                                        className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {!notif.read && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted"
                                                onClick={() => markAsRead(notif.id)}
                                                title="Mark as read"
                                            >
                                                <Check className="h-3 w-3" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => deleteNotification(notif.id)}
                                            title="Delete notification"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
