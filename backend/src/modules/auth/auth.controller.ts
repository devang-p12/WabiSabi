import type { Request, Response } from "express";
import { registerSchema , loginSchema} from "./auth.schema.js";
import { registerUser } from "./auth.service.js";
import { loginUser } from "./auth.service.js";


export const register = async (
    req: Request,
    res: Response
) => {
    const result = registerSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: result.error.issues[0]?.message ?? "Invalid request",
            },
        });
    }

    try {
        const user = await registerUser(result.data);

        return res.status(201).json({
            success: true,
            data: {
                user,
            },
        });
    } catch (error) {
        if (
            error instanceof Error &&
            error.message === "EMAIL_ALREADY_EXISTS"
        ) {
            return res.status(409).json({
                success: false,
                error: {
                    code: "EMAIL_ALREADY_EXISTS",
                    message: "An account with this email already exists.",
                },
            });
        }

        console.error(error);

        return res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Something went wrong.",
            },
        });
    }
};

export const login = async (
    req: Request,
    res: Response
) => {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: result.error.issues[0]?.message ?? "Invalid request",
            },
        });
    }

    try {
        const resultData = await loginUser(result.data);

        return res.status(200).json({
            success: true,
            data: resultData,
        });
    } catch (error) {
        if (
            error instanceof Error &&
            error.message === "INVALID_CREDENTIALS"
        ) {
            return res.status(401).json({
                success: false,
                error: {
                    code: "INVALID_CREDENTIALS",
                    message: "Invalid email or password.",
                },
            });
        }

        console.error(error);

        return res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Something went wrong.",
            },
        });
    }
};