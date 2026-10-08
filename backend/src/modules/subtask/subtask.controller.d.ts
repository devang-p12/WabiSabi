import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
export declare const getSubtasksController: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createSubtaskController: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateSubtaskController: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteSubtaskController: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=subtask.controller.d.ts.map