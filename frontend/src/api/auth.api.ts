import { api } from "./client";

export interface User {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface LoginResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
}

export interface RegisterResponse {
    user: User;
}

export interface RefreshResponse {
    accessToken: string;
    refreshToken: string;
}

export const login = async (
    email: string,
    password: string
): Promise<LoginResponse> => {
    const response = await api.post<{
        success: boolean;
        data: LoginResponse;
    }>("/auth/login", {
        email,
        password,
    });

    return response.data.data;
};

export const register = async (
    name: string,
    email: string,
    password: string
): Promise<RegisterResponse> => {
    const response = await api.post<{
        success: boolean;
        data: RegisterResponse;
    }>("/auth/register", {
        name,
        email,
        password,
    });

    return response.data.data;
};

export const getCurrentUser = async (
    accessToken: string
): Promise<User> => {
    const response = await api.get<{
        success: boolean;
        data: {
            user: User;
        };
    }>("/auth/me", {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    return response.data.data.user;
};

export const refreshToken = async (
    refreshTokenValue: string
): Promise<RefreshResponse> => {
    const response = await api.post<{
        success: boolean;
        data: RefreshResponse;
    }>("/auth/refresh", {
        refreshToken: refreshTokenValue,
    });

    return response.data.data;
};

export const logout = async (
    refreshTokenValue: string
): Promise<void> => {
    await api.post("/auth/logout", {
        refreshToken: refreshTokenValue,
    });
};