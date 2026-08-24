import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import type { Role } from "../types/auth";

/**
 * Restricts children to the given roles. This is a client-side convenience
 * only — every backend endpoint also enforces RBAC server-side via
 * @PreAuthorize, which is the real authority.
 */
export function RoleGuard({ allowedRoles, children }: { allowedRoles: Role[]; children: ReactNode }) {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
