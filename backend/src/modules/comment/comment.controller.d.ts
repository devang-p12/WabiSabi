import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
export declare const getTaskCommentsController: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const createCommentController: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const deleteCommentController: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=comment.controller.d.ts.map