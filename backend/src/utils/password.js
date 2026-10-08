import argon2 from "argon2";
export const hashPassword = async (password) => {
    return argon2.hash(password);
};
export const verifyPassword = async (hash, password) => {
    return argon2.verify(hash, password);
};
export const hashToken = async (token) => {
    return argon2.hash(token);
};
export const verifyToken = async (hash, token) => {
    return argon2.verify(hash, token);
};
//# sourceMappingURL=password.js.map