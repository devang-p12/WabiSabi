import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
export declare const register: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const login: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getCurrentUser: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const refresh: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const logout: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=auth.controller.d.ts.map