import { verifyAccessToken } from "../utils/jwt.js";
export const authenticate = (req, res, next) => {
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
        if (typeof payload !== "object" ||
            payload === null ||
            !("userId" in payload)) {
            return res.status(401).json({
                success: false,
                error: {
                    code: "INVALID_TOKEN",
                    message: "Invalid access token.",
                },
            });
        }
        req.userId = payload.userId;
        next();
    }
    catch {
        return res.status(401).json({
            success: false,
            error: {
                code: "INVALID_TOKEN",
                message: "Invalid or expired access token.",
            },
        });
    }
};
//# sourceMappingURL=auth.middleware.js.map