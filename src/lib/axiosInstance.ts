
import axios from "axios";
import { notifyError } from "./notify";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:3001";

const AUTH_ENDPOINTS = [
  "/auth/login",
  "/auth/signup",
  "/auth/refresh-token",
  "/auth/client-registration",
  "/auth/check-username",
  "/auth/registration-meta",
];


const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 300000,
});

// Global error handler
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    let message = "An unexpected error occurred.";
    if (error.response?.data?.message) {
      message = Array.isArray(error.response.data.message)
        ? error.response.data.message.join(" ")
        : error.response.data.message;
    } else if (error.message) {
      message = error.message;
    }
    notifyError(message);
    return Promise.reject(error);
  }
);

let refreshPromise: Promise<string | null> | null = null;

export const clearAuthStorage = () => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("token");
};

const redirectToLogin = () => {
  if (typeof window === "undefined") {
    return;
  }

  const isAuthScreen = window.location.pathname.startsWith("/auth");

  if (isAuthScreen) {
    return;
  }

  const nextPath = `${window.location.pathname}${window.location.search}`;
  window.location.replace(`/auth/sign-in?next=${encodeURIComponent(nextPath)}`);
};

const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        `${API_BASE_URL}/auth/refresh-token`,
        {},
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
      .then((response) => {
        const nextToken = response.data?.access_token;

        if (typeof window !== "undefined" && nextToken) {
          localStorage.setItem("token", nextToken);
        }

        return nextToken ?? null;
      })
      .catch(() => {
        clearAuthStorage();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

axiosInstance.interceptors.request.use(
  (config) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as
      | (typeof error.config & { _retry?: boolean })
      | undefined;
    const requestUrl = originalRequest?.url ?? "";
    const isAuthRequest = AUTH_ENDPOINTS.some((endpoint) =>
      requestUrl.includes(endpoint),
    );

    if (
      typeof window !== "undefined" &&
      error?.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthRequest
    ) {
      originalRequest._retry = true;

      const nextToken = await refreshAccessToken();

      if (nextToken && originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${nextToken}`;
        return axiosInstance(originalRequest);
      }

      clearAuthStorage();
      redirectToLogin();
    }

    if (
      typeof window !== "undefined" &&
      error?.response?.status === 401 &&
      !isAuthRequest
    ) {
      clearAuthStorage();
      redirectToLogin();
    }

    return Promise.reject(error);
  },
);

export const getApiErrorMessage = (
  error: any,
  fallbackMessage = "Something went wrong. Please try again.",
) => {
  if (error?.code === "ERR_NETWORK") {
    return `Unable to reach the API at ${API_BASE_URL}. Please make sure the backend is running.`;
  }

  const message = error?.response?.data?.message ?? error?.message;

  if (Array.isArray(message)) {
    return message.join(", ");
  }

  if (typeof message === "string" && message.trim()) {
    return message;
  }

  return fallbackMessage;
};

export default axiosInstance;

