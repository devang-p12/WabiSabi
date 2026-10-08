import type { NextFunction, Request, Response } from "express";
export interface AuthenticatedRequest extends Request {
    userId?: string;
}
export declare const authenticate: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=auth.middleware.d.ts.map