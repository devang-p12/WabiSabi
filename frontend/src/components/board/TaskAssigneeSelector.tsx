import { User, Check, X } from "lucide-react";
import { cn } from "cn";

import type { WorkspaceMember } from "@/api/workspace.api";
import type { TaskAssignee } from "@/api/task.api";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TaskAssigneeSelectorProps {
    members: WorkspaceMember[];
    assigneeId?: string | null;
    assignee?: TaskAssignee | null;
    onAssign: (userId: string | null) => void | Promise<void>;
    disabled?: boolean;
    compact?: boolean;
}

function getInitials(name?: string): string {
    if (!name || typeof name !== "string") return "?";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function TaskAssigneeSelector({
    members,
    assigneeId,
    assignee,
    onAssign,
    disabled = false,
    compact = false,
}: TaskAssigneeSelectorProps) {
    // Resolve current assignee details either from prop or from member list
    const currentMember = members.find(
        (m) => m.userId === assigneeId || m.user.id === assigneeId
    );
    const resolvedName = assignee?.name || currentMember?.user.name;
    const resolvedAvatar = assignee?.avatarUrl || currentMember?.user.avatarUrl;
    const resolvedInitials = getInitials(resolvedName);

    const isAssigned = Boolean(assigneeId || assignee);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={disabled}>
                <button
                    type="button"
                    className={cn(
                        "group flex items-center gap-2 rounded-md transition-all cursor-pointer focus:outline-hidden",
                        compact
                            ? "h-6 px-1.5 text-xs hover:bg-muted/60"
                            : "h-8 border px-2.5 text-xs bg-background hover:bg-muted/40 shadow-2xs",
                        isAssigned ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                    title={isAssigned ? `Assigned to ${resolvedName}` : "Assign member"}
                >
                    {isAssigned ? (
                        <>
                            <div className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary border border-primary/20 overflow-hidden">
                                {resolvedAvatar ? (
                                    <img
                                        src={resolvedAvatar}
                                        alt={resolvedName || "User"}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span>{resolvedInitials}</span>
                                )}
                            </div>
                            {!compact && (
                                <span className="truncate max-w-[110px] font-medium">
                                    {resolvedName}
                                </span>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground group-hover:border-foreground group-hover:text-foreground transition-colors">
                                <User className="h-3 w-3" />
                            </div>
                            {!compact && <span>Assign</span>}
                        </>
                    )}
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-56 p-1">
                <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Assign member
                </div>

                {isAssigned && (
                    <>
                        <DropdownMenuItem
                            onClick={() => onAssign(null)}
                            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive focus:text-destructive cursor-pointer"
                        >
                            <X className="h-3.5 w-3.5" />
                            <span>Unassign</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                    </>
                )}

                {members.length === 0 ? (
                    <div className="px-2 py-2 text-xs text-muted-foreground text-center">
                        No workspace members found
                    </div>
                ) : (
                    members.map((member) => {
                        const isSelected =
                            member.userId === assigneeId ||
                            member.user.id === assigneeId;
                        const initials = getInitials(member.user.name);

                        return (
                            <DropdownMenuItem
                                key={member.userId}
                                onClick={() => onAssign(member.userId)}
                                className={cn(
                                    "flex items-center justify-between gap-2 text-xs cursor-pointer py-1.5",
                                    isSelected && "bg-primary/10 font-medium"
                                )}
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary border border-primary/20 overflow-hidden">
                                        {member.user.avatarUrl ? (
                                            <img
                                                src={member.user.avatarUrl}
                                                alt={member.user.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <span>{initials}</span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="truncate font-medium leading-none">
                                            {member.user.name}
                                        </div>
                                        <div className="truncate text-[10px] text-muted-foreground mt-0.5">
                                            {member.user.email}
                                        </div>
                                    </div>
                                </div>

                                {isSelected && (
                                    <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                                )}
                            </DropdownMenuItem>
                        );
                    })
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
