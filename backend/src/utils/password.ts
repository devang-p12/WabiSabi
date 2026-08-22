import argon2 from "argon2";

export const hashPassword = async (password: string) => {
    return argon2.hash(password);
};

export const verifyPassword = async (
    hash: string,
    password: string
) => {
    return argon2.verify(hash, password);
};

export const hashToken = async (token: string) => {
    return argon2.hash(token);
};

export const verifyToken = async (
    hash: string,
    token: string
) => {
    return argon2.verify(hash, token);
};