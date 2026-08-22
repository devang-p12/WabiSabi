import jwt from "jsonwebtoken";

const accessSecret = process.env.JWT_ACCESS_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;

if (!accessSecret || !refreshSecret) {
    throw new Error("JWT secrets are not configured");
}

export const generateAccessToken = (userId: string) => {
    return jwt.sign(
        {
            userId,
        },
        accessSecret,
        {
            expiresIn: "15m",
        }
    );
};

export const generateRefreshToken = (userId: string) => {
    return jwt.sign(
        {
            userId,
        },
        refreshSecret,
        {
            expiresIn: "7d",
        }
    );
};

export const verifyAccessToken = (token: string) => {
    return jwt.verify(token, accessSecret);
};

export const verifyRefreshToken = (token: string) => {
    return jwt.verify(token, refreshSecret);
};