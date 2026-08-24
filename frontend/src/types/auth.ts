export type Role = "CUSTOMER" | "LOAN_OFFICER" | "ADMIN";

export interface JwtResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  username: string;
  role: Role;
}

export interface AuthUser {
  username: string;
  role: Role;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}
