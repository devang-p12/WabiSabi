import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
export declare const createListController: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getBoardListsController: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateListController: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteListController: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=list.controller.d.ts.map