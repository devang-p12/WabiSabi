import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "./SocketContext";
import {
    deleteNotification as apiDeleteNotification,
    getNotifications,
    markAllNotificationsRead as apiMarkAllRead,
    markNotificationRead as apiMarkRead,
    type AppNotification,
} from "@/api/notification.api";

interface NotificationContextType {
    notifications: AppNotification[];
    unreadCount: number;
    loading: boolean;
    recentAlert: AppNotification | null;
    dismissAlert: () => void;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
    notifications: [],
    unreadCount: 0,
    loading: false,
    recentAlert: null,
    dismissAlert: () => {},
    markAsRead: async () => {},
    markAllAsRead: async () => {},
    deleteNotification: async () => {},
    refreshNotifications: async () => {},
});

export const useNotifications = () => useContext(NotificationContext);

// Subtle pleasant web audio chime
function playNotificationChime() {
    try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.35);
    } catch {
        // Audio might be blocked by browser autoplay policy before user gesture
    }
}

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const { isAuthenticated, user } = useAuth();
    const { socket } = useSocket();

    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [recentAlert, setRecentAlert] = useState<AppNotification | null>(null);

    const loadNotifications = useCallback(async () => {
        if (!isAuthenticated) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        try {
            setLoading(true);
            const data = await getNotifications();
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount);
        } catch (error) {
            console.error("Failed to load notifications:", error);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    // Initial load when user signs in
    useEffect(() => {
        loadNotifications();
    }, [loadNotifications, user?.id]);

    // Listen to real-time notification socket event
    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (notification: AppNotification) => {
            playNotificationChime();
            setNotifications((prev) => [notification, ...prev.filter((n) => n.id !== notification.id)]);
            setUnreadCount((prev) => prev + 1);

            // Pop active real-time toast alert
            setRecentAlert(notification);
        };

        socket.on("new_notification", handleNewNotification);

        return () => {
            socket.off("new_notification", handleNewNotification);
        };
    }, [socket]);

    // Auto-dismiss real-time toast alert after 6 seconds
    useEffect(() => {
        if (!recentAlert) return;
        const timer = setTimeout(() => {
            setRecentAlert(null);
        }, 6000);
        return () => clearTimeout(timer);
    }, [recentAlert]);

    const dismissAlert = useCallback(() => {
        setRecentAlert(null);
    }, []);

    const markAsRead = useCallback(async (id: string) => {
        try {
            await apiMarkRead(id);
            setNotifications((prev) =>
                prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        try {
            await apiMarkAllRead();
            setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all notifications as read:", error);
        }
    }, []);

    const deleteNotification = useCallback(
        async (id: string) => {
            try {
                const target = notifications.find((n) => n.id === id);
                await apiDeleteNotification(id);
                setNotifications((prev) => prev.filter((n) => n.id !== id));
                if (target && !target.read) {
                    setUnreadCount((prev) => Math.max(0, prev - 1));
                }
            } catch (error) {
                console.error("Failed to delete notification:", error);
            }
        },
        [notifications]
    );

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                loading,
                recentAlert,
                dismissAlert,
                markAsRead,
                markAllAsRead,
                deleteNotification,
                refreshNotifications: loadNotifications,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};
