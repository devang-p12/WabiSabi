import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { verifyAccessToken } from "./utils/jwt.js";

let io: Server;

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

        socket.on("join_board", (boardId: string) => {
            if (!boardId) return;
            const roomName = `board_${boardId}`;
            socket.join(roomName);
            console.log(`[Socket.io] Socket ${socket.id} joined room ${roomName}`);
        });

        socket.on("leave_board", (boardId: string) => {
            if (!boardId) return;
            const roomName = `board_${boardId}`;
            socket.leave(roomName);
            console.log(`[Socket.io] Socket ${socket.id} left room ${roomName}`);
        });

        socket.on("disconnect", (reason) => {
            console.log(`[Socket.io] Client disconnected: ${socket.id}, reason: ${reason}`);
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
