import type { WorkspaceRole } from "../../generated/prisma/client.js";
export declare const getWorkspaceMembership: (workspaceId: string, userId: string) => Promise<{
    id: string;
    workspaceId: string;
    userId: string;
    role: WorkspaceRole;
    createdAt: Date;
    updatedAt: Date;
} | null>;
export declare const requireWorkspaceAdmin: (workspaceId: string, userId: string) => Promise<{
    id: string;
    workspaceId: string;
    userId: string;
    role: WorkspaceRole;
    createdAt: Date;
    updatedAt: Date;
} | null>;
export declare const requireWorkspaceOwner: (workspaceId: string, userId: string) => Promise<{
    id: string;
    workspaceId: string;
    userId: string;
    role: WorkspaceRole;
    createdAt: Date;
    updatedAt: Date;
} | null>;
export declare const canRemoveWorkspaceMember: (workspaceId: string, currentUserId: string, targetUserId: string) => Promise<boolean>;
//# sourceMappingURL=workspace.authorization.d.ts.map