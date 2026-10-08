import { Server as HttpServer } from "http";
import { Server } from "socket.io";
export interface BoardUserPresence {
    socketId: string;
    userId: string;
    name: string;
    email?: string;
    avatarUrl?: string | null;
    color: string;
    cursor?: {
        x: number;
        y: number;
    } | null;
    draggingTaskId?: string | null;
    draggingTaskTitle?: string | null;
}
export declare const initSocket: (server: HttpServer) => Server<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export declare const getIO: () => Server<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
//# sourceMappingURL=socket.d.ts.map