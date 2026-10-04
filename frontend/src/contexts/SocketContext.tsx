import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";

interface SocketContextType {
    socket: Socket | null;
    connected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    connected: false,
});

export const useSocket = () => useContext(SocketContext);

const SOCKET_URL =
    import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace("/api/v1", "")
        : (typeof window !== "undefined" && window.location.hostname
            ? `http://${window.location.hostname}:3000`
            : "http://localhost:3000");

export const SocketProvider = ({ children }: { children: ReactNode }) => {
    const { accessToken, isAuthenticated } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const storedToken =
            accessToken ||
            sessionStorage.getItem("wabi_access_token") ||
            localStorage.getItem("wabi_access_token");

        if (!storedToken) {
            if (socket) {
                console.log("[SocketContext] No token available, disconnecting socket");
                socket.disconnect();
                setConnected(false);
            }
            return;
        }

        if (!socket) {
            console.log("[SocketContext] Initializing socket connection to", SOCKET_URL);
            const newSocket = io(SOCKET_URL, {
                auth: (cb) => {
                    const currentToken =
                        sessionStorage.getItem("wabi_access_token") ||
                        localStorage.getItem("wabi_access_token") ||
                        accessToken;
                    cb({ token: currentToken });
                },
                transports: ["websocket", "polling"],
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000,
            });

            newSocket.on("connect", () => {
                console.log("[SocketContext] Socket connected! ID:", newSocket.id);
                setConnected(true);
            });

            newSocket.on("disconnect", (reason) => {
                console.log("[SocketContext] Socket disconnected. Reason:", reason);
                setConnected(false);
            });

            newSocket.on("connect_error", (err) => {
                console.warn("[SocketContext] Connection error:", err.message);
                setConnected(false);
            });

            setSocket(newSocket);
        } else {
            // Update auth token for any reconnections
            newSocketAuth(socket, storedToken);
            if (!socket.connected) {
                console.log("[SocketContext] Connecting socket with available token");
                socket.connect();
            }
        }
    }, [accessToken, isAuthenticated, socket]);

    useEffect(() => {
        return () => {
            if (socket) {
                console.log("[SocketContext] Cleaning up socket connection");
                socket.disconnect();
            }
        };
    }, [socket]);

    return (
        <SocketContext.Provider value={{ socket, connected }}>
            {children}
        </SocketContext.Provider>
    );
};

function newSocketAuth(socket: Socket, token: string) {
    socket.auth = { token };
}
