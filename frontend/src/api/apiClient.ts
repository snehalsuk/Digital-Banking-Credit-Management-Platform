import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { clearSession, getAccessToken, getRefreshToken, saveAccessToken } from "../auth/tokenStorage";
import type { JwtResponse } from "../types/auth";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";

export const apiClient = axios.create({
  baseURL: BASE_URL,
});

// Attach the JWT access token to every outgoing request.
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

let refreshInFlight: Promise<string> | null = null;

async function attemptRefresh(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }
  const response = await axios.post<JwtResponse>(`${BASE_URL}/auth/refresh`, { refreshToken });
  saveAccessToken(response.data.accessToken);
  return response.data.accessToken;
}

// On a 401, attempt exactly one silent refresh, then retry the original
// request. If the refresh itself fails, clear the session and redirect to
// login rather than looping.
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        refreshInFlight ??= attemptRefresh().finally(() => {
          refreshInFlight = null;
        });
        const newAccessToken = await refreshInFlight;
        originalRequest.headers.set("Authorization", `Bearer ${newAccessToken}`);
        return apiClient(originalRequest);
      } catch {
        clearSession();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
