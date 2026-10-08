import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
export declare const createBoardController: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getWorkspaceBoardsController: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getBoardController: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateBoardController: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteBoardController: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=board.controller.d.ts.map