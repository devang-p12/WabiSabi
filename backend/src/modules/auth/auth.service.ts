import { prisma } from "../../config/prisma.js";
import {
    hashPassword,
    verifyPassword,
    hashToken,
    verifyToken,
} from "../../utils/password.js";

import {
    verifyRefreshToken,
    generateAccessToken,
    generateRefreshToken,
} from "../../utils/jwt.js";

import type {
    RegisterInput,
    LoginInput,
} from "./auth.schema.js";


export const registerUser = async (data: RegisterInput) => {

    const existingUser = await prisma.user.findUnique({
        where: {
            email: data.email,
        },
    });

    if (existingUser) {
        throw new Error("EMAIL_ALREADY_EXISTS");
    }

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            passwordHash,
        },

        select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return user;
};


export const loginUser = async (data: LoginInput) => {

    const user = await prisma.user.findUnique({
        where: {
            email: data.email,
        },
    });

    if (!user) {
        throw new Error("INVALID_CREDENTIALS");
    }

    const passwordValid = await verifyPassword(
        user.passwordHash,
        data.password
    );

    if (!passwordValid) {
        throw new Error("INVALID_CREDENTIALS");
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    const tokenHash = await hashToken(refreshToken);

    await prisma.refreshToken.create({
        data: {
            tokenHash,
            userId: user.id,

            expiresAt: new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000
            ),
        },
    });
    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        },
        accessToken,
        refreshToken,
    };
};


export const refreshUserToken = async (rawRefreshToken: string) => {
    let payload;

    try {
        payload = verifyRefreshToken(rawRefreshToken);
    } catch {
        throw new Error("INVALID_REFRESH_TOKEN");
    }

    if (
        typeof payload !== "object" ||
        payload === null ||
        !("userId" in payload)
    ) {
        throw new Error("INVALID_REFRESH_TOKEN");
    }

    const userId = payload.userId;

    if (typeof userId !== "string") {
        throw new Error("INVALID_REFRESH_TOKEN");
    }

    const tokens = await prisma.refreshToken.findMany({
        where: {
            userId,
            revokedAt: null,
        },
    });

    let matchedToken = null;

    for (const token of tokens) {
        const matches = await verifyToken(
            token.tokenHash,
            rawRefreshToken
        );

        if (matches) {
            matchedToken = token;
            break;
        }
    }

    if (!matchedToken) {
        throw new Error("INVALID_REFRESH_TOKEN");
    }

    if (matchedToken.expiresAt <= new Date()) {
        throw new Error("REFRESH_TOKEN_EXPIRED");
    }

    await prisma.refreshToken.update({
        where: {
            id: matchedToken.id,
        },
        data: {
            revokedAt: new Date(),
        },
    });

    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);

    const tokenHash = await hashToken(refreshToken);

    await prisma.refreshToken.create({
        data: {
            tokenHash,
            userId,
            expiresAt: new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000
            ),
        },
    });

    return {
        accessToken,
        refreshToken,
    };
};