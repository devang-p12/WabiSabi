import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { verifyAccessToken } from "./utils/jwt.js";
import { prisma } from "./config/prisma.js";

let io: Server;

export interface BoardUserPresence {
    socketId: string;
    userId: string;
    name: string;
    email?: string;
    avatarUrl?: string | null;
    color: string;
    cursor?: { x: number; y: number } | null;
    draggingTaskId?: string | null;
    draggingTaskTitle?: string | null;
}

const CURSOR_COLORS = [
    "#3B82F6", // Blue
    "#10B981", // Emerald
    "#8B5CF6", // Purple
    "#F59E0B", // Amber
    "#EC4899", // Pink
    "#06B6D4", // Cyan
    "#F97316", // Orange
    "#14B8A6", // Teal
    "#6366F1", // Indigo
    "#E11D48", // Rose
];

function getColorForUser(userId: string): string {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = (hash << 5) - hash + userId.charCodeAt(i);
        hash |= 0;
    }
    const index = Math.abs(hash) % CURSOR_COLORS.length;
    return CURSOR_COLORS[index];
}

// In-memory presence state per board: boardId -> (socketId -> BoardUserPresence)
const boardPresence = new Map<string, Map<string, BoardUserPresence>>();
// Map of socketId -> Set of boardIds joined
const socketBoards = new Map<string, Set<string>>();

export const initSocket = (server: HttpServer) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    // Authentication middleware
    io.use((socket, next) => {
        let token = socket.handshake.auth?.token;
        if (!token && socket.handshake.headers?.authorization) {
            token = socket.handshake.headers.authorization;
        }

        if (!token) {
            console.log(`[Socket.io] Connection rejected: Token missing for socket ${socket.id}`);
            return next(new Error("Authentication error: Token missing"));
        }

        if (typeof token === "string" && token.startsWith("Bearer ")) {
            token = token.slice(7);
        }

        try {
            const payload = verifyAccessToken(token);
            if (!payload || typeof payload !== "object") {
                console.log(`[Socket.io] Connection rejected: Invalid token payload for socket ${socket.id}`);
                return next(new Error("Authentication error: Invalid token"));
            }
            // @ts-ignore
            socket.userId = payload.userId;
            console.log(`[Socket.io] Authenticated user ${payload.userId} on socket ${socket.id}`);
            next();
        } catch (error: any) {
            console.log(`[Socket.io] Connection rejected: ${error?.message || "Invalid or expired token"} for socket ${socket.id}`);
            return next(new Error("Authentication error: Invalid or expired token"));
        }
    });

    io.on("connection", (socket: Socket) => {
        console.log(`[Socket.io] Client connected: ${socket.id}`);

        socket.on(
            "join_board",
            async (data: string | { boardId: string; user?: { id?: string; name?: string; email?: string; avatarUrl?: string | null } }) => {
                const boardId = typeof data === "string" ? data : data?.boardId;
                if (!boardId) return;

                const roomName = `board_${boardId}`;
                socket.join(roomName);

                let userInfo = typeof data === "object" ? data.user : undefined;
                // @ts-ignore
                const userId = socket.userId || userInfo?.id || socket.id;

                if (!userInfo?.name) {
                    try {
                        const dbUser = await prisma.user.findUnique({
                            where: { id: userId },
                            select: { id: true, name: true, email: true, avatarUrl: true },
                        });
                        if (dbUser) {
                            userInfo = dbUser;
                        }
                    } catch {
                        // ignore DB error
                    }
                }

                const userName = userInfo?.name || "Collaborator";
                const userEmail = userInfo?.email || "";
                const userAvatar = userInfo?.avatarUrl || null;
                const color = getColorForUser(userId);

                const presenceData: BoardUserPresence = {
                    socketId: socket.id,
                    userId,
                    name: userName,
                    email: userEmail,
                    avatarUrl: userAvatar,
                    color,
                    cursor: null,
                    draggingTaskId: null,
                    draggingTaskTitle: null,
                };

                if (!boardPresence.has(boardId)) {
                    boardPresence.set(boardId, new Map());
                }
                boardPresence.get(boardId)!.set(socket.id, presenceData);

                if (!socketBoards.has(socket.id)) {
                    socketBoards.set(socket.id, new Set());
                }
                socketBoards.get(socket.id)!.add(boardId);

                // Broadcast full presence state to everyone in the room
                const members = Array.from(boardPresence.get(boardId)!.values());
                io.to(roomName).emit("presence_state", members);

                console.log(`[Socket.io] ${userName} (${socket.id}) joined ${roomName}. Online users: ${members.length}`);
            }
        );

        // Real-time cursor position tracking
        socket.on("cursor_move", ({ boardId, x, y }: { boardId: string; x: number; y: number }) => {
            if (!boardId) return;
            const room = boardPresence.get(boardId);
            const user = room?.get(socket.id);
            if (user) {
                user.cursor = { x, y };
                socket.to(`board_${boardId}`).emit("user_cursor", {
                    socketId: socket.id,
                    userId: user.userId,
                    name: user.name,
                    color: user.color,
                    x,
                    y,
                    draggingTaskId: user.draggingTaskId,
                    draggingTaskTitle: user.draggingTaskTitle,
                });
            }
        });

        socket.on("cursor_leave", ({ boardId }: { boardId: string }) => {
            if (!boardId) return;
            const room = boardPresence.get(boardId);
            const user = room?.get(socket.id);
            if (user) {
                user.cursor = null;
                socket.to(`board_${boardId}`).emit("user_cursor_leave", {
                    socketId: socket.id,
                    userId: user.userId,
                });
            }
        });

        // Live card drag indicators
        socket.on("card_drag_start", ({ boardId, taskId, taskTitle }: { boardId: string; taskId: string; taskTitle?: string }) => {
            if (!boardId || !taskId) return;
            const room = boardPresence.get(boardId);
            const user = room?.get(socket.id);
            if (user) {
                user.draggingTaskId = taskId;
                user.draggingTaskTitle = taskTitle || null;
                socket.to(`board_${boardId}`).emit("card_drag_start", {
                    socketId: socket.id,
                    userId: user.userId,
                    userName: user.name,
                    color: user.color,
                    taskId,
                    taskTitle: taskTitle || null,
                });
                console.log(`[Socket.io] ${user.name} started dragging task ${taskId} in board ${boardId}`);
            }
        });

        socket.on("card_drag_end", ({ boardId, taskId }: { boardId: string; taskId?: string }) => {
            if (!boardId) return;
            const room = boardPresence.get(boardId);
            const user = room?.get(socket.id);
            if (user) {
                const prevTaskId = user.draggingTaskId || taskId;
                user.draggingTaskId = null;
                user.draggingTaskTitle = null;
                socket.to(`board_${boardId}`).emit("card_drag_end", {
                    socketId: socket.id,
                    userId: user.userId,
                    taskId: prevTaskId,
                });
                console.log(`[Socket.io] ${user.name} ended dragging task in board ${boardId}`);
            }
        });

        const handleLeaveBoard = (boardId: string) => {
            const roomName = `board_${boardId}`;
            socket.leave(roomName);

            const room = boardPresence.get(boardId);
            if (room) {
                const user = room.get(socket.id);
                if (user?.draggingTaskId) {
                    socket.to(roomName).emit("card_drag_end", {
                        socketId: socket.id,
                        userId: user.userId,
                        taskId: user.draggingTaskId,
                    });
                }
                socket.to(roomName).emit("user_cursor_leave", {
                    socketId: socket.id,
                    userId: user?.userId,
                });
                room.delete(socket.id);
                if (room.size === 0) {
                    boardPresence.delete(boardId);
                } else {
                    io.to(roomName).emit("presence_state", Array.from(room.values()));
                }
            }

            const boards = socketBoards.get(socket.id);
            if (boards) {
                boards.delete(boardId);
                if (boards.size === 0) {
                    socketBoards.delete(socket.id);
                }
            }
        };

        socket.on("leave_board", (boardId: string) => {
            if (!boardId) return;
            handleLeaveBoard(boardId);
            console.log(`[Socket.io] Socket ${socket.id} left room board_${boardId}`);
        });

        socket.on("disconnect", (reason) => {
            console.log(`[Socket.io] Client disconnected: ${socket.id}, reason: ${reason}`);
            const boards = socketBoards.get(socket.id);
            if (boards) {
                for (const boardId of Array.from(boards)) {
                    handleLeaveBoard(boardId);
                }
            }
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized");
    }
    return io;
};
