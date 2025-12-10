import axios, { AxiosError } from "axios";

// ⚠️ Let erop dat VITE_ prefix nodig is voor frontend env variables
const API_BASE_URL = import.meta.env.VITE_API_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const data = error.response?.data as { error?: string } | undefined;
    const message = data?.error || error.message;

    // Direct naar error page zonder 500 flash
    if (status === 429) {
      window.location.href = `/error?status=429&message=${encodeURIComponent(
        message || "Te veel requests, probeer later opnieuw."
      )}`;
      return new Promise(() => {}); // houdt de promise pending zodat React niks flasht
    }

    if (status === 401) {
      window.location.href = `/error?status=401&message=${encodeURIComponent(
        message || "Ongeldige sessie, log opnieuw in."
      )}`;
      return new Promise(() => {});
    }

    return Promise.reject(error);
  }
);

export default apiClient;
