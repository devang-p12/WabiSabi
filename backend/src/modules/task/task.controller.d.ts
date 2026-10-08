import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
export declare const createTaskController: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getListTasksController: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getTaskController: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateTaskController: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteTaskController: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const moveTaskController: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=task.controller.d.ts.map