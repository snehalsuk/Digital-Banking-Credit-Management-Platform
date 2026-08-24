import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import * as authApi from "../api/authApi";
import { clearSession, getStoredUser, saveSession } from "./tokenStorage";
import type { AuthUser, LoginRequest, RegisterRequest } from "../types/auth";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (request: LoginRequest) => Promise<void>;
  register: (request: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());

  const login = useCallback(async (request: LoginRequest) => {
    const response = await authApi.login(request);
    saveSession(response.accessToken, response.refreshToken, response.username, response.role);
    setUser({ username: response.username, role: response.role });
  }, []);

  const register = useCallback(async (request: RegisterRequest) => {
    const response = await authApi.register(request);
    saveSession(response.accessToken, response.refreshToken, response.username, response.role);
    setUser({ username: response.username, role: response.role });
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, login, register, logout }),
    [user, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
