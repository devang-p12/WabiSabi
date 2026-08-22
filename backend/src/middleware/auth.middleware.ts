import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt.js";

export interface AuthenticatedRequest extends Request {
    userId?: string;
}

export const authenticate = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            error: {
                code: "UNAUTHORIZED",
                message: "Authentication required.",
            },
        });
    }

    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({
            success: false,
            error: {
                code: "INVALID_AUTH_HEADER",
                message: "Invalid authorization header.",
            },
        });
    }

    try {
        const payload = verifyAccessToken(token);

        if (
            typeof payload !== "object" ||
            payload === null ||
            !("userId" in payload)
        ) {
            return res.status(401).json({
                success: false,
                error: {
                    code: "INVALID_TOKEN",
                    message: "Invalid access token.",
                },
            });
        }

        req.userId = payload.userId as string;

        next();
    } catch {
        return res.status(401).json({
            success: false,
            error: {
                code: "INVALID_TOKEN",
                message: "Invalid or expired access token.",
            },
        });
    }
};