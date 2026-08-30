import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";

import {
    getCurrentUser,
    login as loginApi,
    logout as logoutApi,
    refreshToken as refreshTokenApi,
    register as registerApi,
    type User,
} from "@/api/auth.api";

interface AuthContextType {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    loading: boolean;
    isAuthenticated: boolean;

    login: (
        email: string,
        password: string
    ) => Promise<void>;

    register: (
        name: string,
        email: string,
        password: string
    ) => Promise<void>;

    logout: () => Promise<void>;
}

const AuthContext = createContext<
    AuthContextType | undefined
>(undefined);

const ACCESS_TOKEN_KEY = "wabi_access_token";
const REFRESH_TOKEN_KEY = "wabi_refresh_token";

export function AuthProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [user, setUser] = useState<User | null>(null);

    const [accessToken, setAccessToken] =
        useState<string | null>(null);

    const [refreshToken, setRefreshToken] =
        useState<string | null>(null);

    const [loading, setLoading] = useState(true);

    /*
     * Restore session when the app starts.
     */
    useEffect(() => {
        const restoreSession = async () => {
            try {
                const storedAccessToken =
                    sessionStorage.getItem(
                        ACCESS_TOKEN_KEY
                    );

                const storedRefreshToken =
                    sessionStorage.getItem(
                        REFRESH_TOKEN_KEY
                    );

                /*
                 * No saved session.
                 */
                if (!storedRefreshToken) {
                    return;
                }

                /*
                 * Try existing access token first.
                 */
                if (storedAccessToken) {
                    try {
                        const currentUser =
                            await getCurrentUser(
                                storedAccessToken
                            );

                        setAccessToken(
                            storedAccessToken
                        );

                        setRefreshToken(
                            storedRefreshToken
                        );

                        setUser(currentUser);

                        return;
                    } catch {
                        /*
                         * Access token expired.
                         * We'll refresh below.
                         */
                    }
                }

                /*
                 * Access token is missing or expired.
                 * Use refresh token.
                 */
                const result =
                    await refreshTokenApi(
                        storedRefreshToken
                    );

                sessionStorage.setItem(
                    ACCESS_TOKEN_KEY,
                    result.accessToken
                );

                sessionStorage.setItem(
                    REFRESH_TOKEN_KEY,
                    result.refreshToken
                );

                const currentUser =
                    await getCurrentUser(
                        result.accessToken
                    );

                setAccessToken(
                    result.accessToken
                );

                setRefreshToken(
                    result.refreshToken
                );

                setUser(currentUser);
            } catch (error) {
                console.error(
                    "Failed to restore session:",
                    error
                );

                clearSession();
            } finally {
                setLoading(false);
            }
        };

        restoreSession();
    }, []);

    const clearSession = () => {
        sessionStorage.removeItem(
            ACCESS_TOKEN_KEY
        );

        sessionStorage.removeItem(
            REFRESH_TOKEN_KEY
        );

        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);
    };

    /*
     * Login
     */
    const login = async (
        email: string,
        password: string
    ) => {
        const result = await loginApi(
            email,
            password
        );

        sessionStorage.setItem(
            ACCESS_TOKEN_KEY,
            result.accessToken
        );

        sessionStorage.setItem(
            REFRESH_TOKEN_KEY,
            result.refreshToken
        );

        setAccessToken(result.accessToken);
        setRefreshToken(result.refreshToken);
        setUser(result.user);
    };

    /*
     * Register
     */
    const register = async (
        name: string,
        email: string,
        password: string
    ) => {
        await registerApi(
            name,
            email,
            password
        );
    };

    /*
     * Logout
     */
    const logout = async () => {
        try {
            if (refreshToken) {
                await logoutApi(refreshToken);
            }
        } catch (error) {
            console.error(
                "Logout request failed:",
                error
            );
        } finally {
            clearSession();
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                accessToken,
                refreshToken,
                loading,
                isAuthenticated:
                    !!user && !!accessToken,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used inside AuthProvider"
        );
    }

    return context;
}