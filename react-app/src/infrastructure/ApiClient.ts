import axios, {AxiosError} from "axios";

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
    authToken = token;
};

// Let erop dat VITE_ prefix nodig is voor frontend env variables
const API_BASE_URL = import.meta.env.VITE_API_URL;

const apiClient = axios.create({
    baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
    if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        const status = error.response?.status;
        // const data = error.response?.data as { error?: string } | undefined;
        // const message = data?.error || error.message;

        // Direct naar error page zonder 500 flash
        if (status === 429) {
            window.location.href = `/error?status=429&message=${encodeURIComponent("Te veel requests, probeer later opnieuw."
            )}`;
            return new Promise(() => {
            }); // houdt de promise pending zodat React niks flasht
        }

        if (status === 401) {
            window.location.href =
                `/error?status=401&reason=expired_token&message=${encodeURIComponent("Sessie verlopen. Log opnieuw in."
                )}`;

            return new Promise(() => {
            });
        }


        return Promise.reject(error);
    }
);

export default apiClient;
