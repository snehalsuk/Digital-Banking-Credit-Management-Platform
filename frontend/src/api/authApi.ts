import { apiClient } from "./apiClient";
import type { JwtResponse, LoginRequest, RefreshTokenRequest, RegisterRequest } from "../types/auth";

export async function register(request: RegisterRequest): Promise<JwtResponse> {
  const response = await apiClient.post<JwtResponse>("/auth/register", request);
  return response.data;
}

export async function login(request: LoginRequest): Promise<JwtResponse> {
  const response = await apiClient.post<JwtResponse>("/auth/login", request);
  return response.data;
}

export async function refresh(request: RefreshTokenRequest): Promise<JwtResponse> {
  const response = await apiClient.post<JwtResponse>("/auth/refresh", request);
  return response.data;
}
