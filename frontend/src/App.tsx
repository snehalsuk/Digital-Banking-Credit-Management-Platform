import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { RoleGuard } from "./auth/RoleGuard";
import { AppShell } from "./components/layout/AppShell";
import { ToastProvider } from "./components/common/ToastContext";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ProfilePage } from "./pages/ProfilePage";
import { DashboardPage } from "./pages/DashboardPage";
import { AccountsPage } from "./pages/AccountsPage";
import { AccountDetailPage } from "./pages/AccountDetailPage";
import { TransactionsPage } from "./pages/TransactionsPage";
import { LoansPage } from "./pages/LoansPage";
import { LoanDetailPage } from "./pages/LoanDetailPage";
import { CreditScorePage } from "./pages/CreditScorePage";
import { AdminAuditPage } from "./pages/AdminAuditPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import type { Role } from "./types/auth";
import "./App.css";

function HomeRedirect() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
}

/** Wraps a page in auth + the persistent sidebar app shell. */
function Protected({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const content = roles ? <RoleGuard allowedRoles={roles}>{children}</RoleGuard> : children;
  return (
    <ProtectedRoute>
      <AppShell>{content}</AppShell>
    </ProtectedRoute>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <Protected>
            <DashboardPage />
          </Protected>
        }
      />
      <Route
        path="/profile"
        element={
          <Protected>
            <ProfilePage />
          </Protected>
        }
      />
      <Route
        path="/accounts"
        element={
          <Protected>
            <AccountsPage />
          </Protected>
        }
      />
      <Route
        path="/accounts/:id"
        element={
          <Protected>
            <AccountDetailPage />
          </Protected>
        }
      />
      <Route
        path="/accounts/:id/transactions"
        element={
          <Protected>
            <TransactionsPage />
          </Protected>
        }
      />
      <Route
        path="/loans"
        element={
          <Protected>
            <LoansPage />
          </Protected>
        }
      />
      <Route
        path="/loans/:id"
        element={
          <Protected>
            <LoanDetailPage />
          </Protected>
        }
      />
      <Route
        path="/credit-score"
        element={
          <Protected>
            <CreditScorePage />
          </Protected>
        }
      />
      <Route
        path="/admin/audit"
        element={
          <Protected roles={["ADMIN"]}>
            <AdminAuditPage />
          </Protected>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
