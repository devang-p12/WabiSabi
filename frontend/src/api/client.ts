import axios, {
    type AxiosError,
    type InternalAxiosRequestConfig,
} from "axios";

const API_URL = "http://localhost:3000/api/v1";

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

type RetryConfig = InternalAxiosRequestConfig & {
    _retry?: boolean;
};

let isRefreshing = false;

let waitingRequests: Array<{
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
}> = [];

const getAccessToken = () =>
    sessionStorage.getItem("wabi_access_token");

const getRefreshToken = () =>
    sessionStorage.getItem("wabi_refresh_token");

const saveTokens = (
    accessToken: string,
    refreshToken: string
) => {
    sessionStorage.setItem(
        "wabi_access_token",
        accessToken
    );

    sessionStorage.setItem(
        "wabi_refresh_token",
        refreshToken
    );
};

const clearTokens = () => {
    sessionStorage.removeItem(
        "wabi_access_token"
    );

    sessionStorage.removeItem(
        "wabi_refresh_token"
    );
};

/*
 * Attach access token to every API request.
 */
api.interceptors.request.use((config) => {
    const token = getAccessToken();

    if (token) {
        config.headers.Authorization =
            `Bearer ${token}`;
    }

    return config;
});

/*
 * Handle expired access tokens.
 */
api.interceptors.response.use(
    (response) => response,

    async (error: AxiosError) => {
        const originalRequest =
            error.config as RetryConfig;

        if (
            error.response?.status !== 401 ||
            originalRequest?._retry
        ) {
            return Promise.reject(error);
        }

        /*
         * Never try to refresh the refresh request itself.
         */
        if (
            originalRequest.url?.includes(
                "/auth/refresh"
            )
        ) {
            clearTokens();

            return Promise.reject(error);
        }

        const refreshToken =
            getRefreshToken();

        if (!refreshToken) {
            clearTokens();

            return Promise.reject(error);
        }

        /*
         * Another request is already refreshing.
         * Wait for it.
         */
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                waitingRequests.push({
                    resolve,
                    reject,
                });
            }).then((newToken) => {
                originalRequest.headers.Authorization =
                    `Bearer ${newToken}`;

                return api(originalRequest);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            /*
             * Use normal axios instead of `api`
             * so the interceptor doesn't intercept
             * this refresh request.
             */
            const response = await axios.post(
                `${API_URL}/auth/refresh`,
                {
                    refreshToken,
                }
            );

            const {
                accessToken,
                refreshToken: newRefreshToken,
            } = response.data.data;

            saveTokens(
                accessToken,
                newRefreshToken
            );

            /*
             * Resolve all requests that were
             * waiting for the refresh.
             */
            waitingRequests.forEach(
                ({ resolve }) => {
                    resolve(accessToken);
                }
            );

            waitingRequests = [];

            /*
             * Retry the original request.
             */
            originalRequest.headers.Authorization =
                `Bearer ${accessToken}`;

            return api(originalRequest);
        } catch (refreshError) {
            waitingRequests.forEach(
                ({ reject }) => {
                    reject(refreshError);
                }
            );

            waitingRequests = [];

            clearTokens();

            return Promise.reject(
                refreshError
            );
        } finally {
            isRefreshing = false;
        }
    }
);