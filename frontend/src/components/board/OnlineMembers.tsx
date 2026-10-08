import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export interface BoardUserPresence {
    socketId: string;
    userId: string;
    name: string;
    email?: string;
    avatarUrl?: string | null;
    color: string;
}

interface OnlineMembersProps {
    members?: BoardUserPresence[] | null;
    currentUserId?: string | null;
}

function getInitials(name?: string): string {
    if (!name || typeof name !== "string") return "?";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function OnlineMembers({
    members,
    currentUserId,
}: OnlineMembersProps) {
    if (!members || !Array.isArray(members) || members.length === 0) return null;

    const maxVisible = 4;
    const visibleMembers = members.slice(0, maxVisible);
    const overflowCount = members.length - maxVisible;

    return (
        <div className="flex items-center gap-2">
            {/* Live Online Badge */}
            <div className="hidden items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 sm:flex">
                <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span>{members.length} online</span>
            </div>

            {/* Overlapping Avatars */}
            <div className="flex items-center -space-x-2 overflow-hidden py-1">
                {visibleMembers.map((member) => {
                    const isMe = member.userId === currentUserId;
                    const initials = getInitials(member.name);
                    const color = member.color || "#3B82F6";

                    return (
                        <Tooltip key={member.socketId}>
                            <TooltipTrigger asChild>
                                <div
                                    title={`${member.name}${isMe ? " (You)" : ""}`}
                                    className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-background text-xs font-semibold text-white transition-transform hover:z-20 hover:scale-110 shadow-sm"
                                    style={{ backgroundColor: color }}
                                >
                                    {member.avatarUrl ? (
                                        <img
                                            src={member.avatarUrl}
                                            alt={member.name || "Member"}
                                            className="h-full w-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <span>{initials}</span>
                                    )}

                                    {/* Online indicator dot */}
                                    <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-500" />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">
                                <div className="font-semibold">
                                    {member.name || "User"} {isMe && "(You)"}
                                </div>
                                {member.email && (
                                    <div className="text-[10px] text-muted-foreground">
                                        {member.email}
                                    </div>
                                )}
                                <div className="mt-0.5 text-[10px] text-emerald-500 flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    Active now
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    );
                })}

                {overflowCount > 0 && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-semibold text-muted-foreground transition-transform hover:scale-105">
                                +{overflowCount}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                            <div>+{overflowCount} more collaborators online</div>
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>
        </div>
    );
}
