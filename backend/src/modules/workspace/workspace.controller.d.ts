import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
export declare const createWorkspaceController: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getUserWorkspacesController: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getWorkspaceByIdController: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateWorkspaceController: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const deleteWorkspaceController: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getWorkspaceMembersController: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const addWorkspaceMemberController: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateWorkspaceMemberController: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const removeWorkspaceMemberController: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=workspace.controller.d.ts.map