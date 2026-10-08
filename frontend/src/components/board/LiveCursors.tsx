import { Move } from "lucide-react";

export interface RemoteCursor {
    socketId: string;
    userId: string;
    name: string;
    color?: string;
    x: number;
    y: number;
    draggingTaskId?: string | null;
    draggingTaskTitle?: string | null;
}

interface LiveCursorsProps {
    cursors?: RemoteCursor[] | null;
}

export default function LiveCursors({ cursors }: LiveCursorsProps) {
    if (!cursors || !Array.isArray(cursors) || cursors.length === 0) return null;

    return (
        <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
            {cursors.map((cursor) => {
                if (!cursor || typeof cursor.x !== "number" || typeof cursor.y !== "number") {
                    return null;
                }
                const color = cursor.color || "#3B82F6";
                const name = cursor.name || "Collaborator";

                return (
                    <div
                        key={cursor.socketId}
                        className="absolute left-0 top-0 will-change-transform"
                        style={{
                            transform: `translate3d(${cursor.x}px, ${cursor.y}px, 0)`,
                            transition: "transform 70ms cubic-bezier(0, 0, 0.2, 1)",
                        }}
                    >
                        {/* Cursor Pointer */}
                        <svg
                            className="h-5 w-5 -translate-x-1 -translate-y-1 drop-shadow-md"
                            viewBox="0 0 24 24"
                            fill="none"
                        >
                            <path
                                d="M4.5 3.5L11.5 20.5L14.5 13.5L21.5 10.5L4.5 3.5Z"
                                fill={color}
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinejoin="round"
                            />
                        </svg>

                        {/* Name Pill */}
                        <div
                            className="ml-3 mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white shadow-md backdrop-blur-sm select-none"
                            style={{ backgroundColor: color }}
                        >
                            <span>{name}</span>
                        </div>

                        {/* Dragging Card Ghost Indicator attached to cursor */}
                        {cursor.draggingTaskId && (
                            <div
                                className="mt-1 ml-3 flex max-w-[200px] items-center gap-1.5 rounded-md border border-white/20 bg-background/95 px-2 py-1 text-[11px] font-medium text-foreground shadow-lg backdrop-blur-md select-none ring-1"
                                style={{ borderColor: color }}
                            >
                                <Move
                                    className="h-3 w-3 shrink-0 animate-pulse"
                                    style={{ color }}
                                />
                                <span className="truncate">
                                    {cursor.draggingTaskTitle || "Moving card..."}
                                </span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
