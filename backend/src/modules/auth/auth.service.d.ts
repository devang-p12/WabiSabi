import type { RegisterInput, LoginInput } from "./auth.schema.js";
export declare const registerUser: (data: RegisterInput) => Promise<{
    avatarUrl: string | null;
    createdAt: Date;
    email: string;
    id: string;
    name: string;
    updatedAt: Date;
}>;
export declare const loginUser: (data: LoginInput) => Promise<{
    user: {
        id: string;
        name: string;
        email: string;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
    };
    accessToken: string;
    refreshToken: string;
}>;
export declare const refreshUserToken: (rawRefreshToken: string) => Promise<{
    accessToken: string;
    refreshToken: string;
}>;
export declare const logoutUser: (rawRefreshToken: string) => Promise<void>;
//# sourceMappingURL=auth.service.d.ts.map