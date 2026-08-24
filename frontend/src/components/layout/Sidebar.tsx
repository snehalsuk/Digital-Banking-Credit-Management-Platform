import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import {
  BankIcon,
  DashboardIcon,
  GaugeIcon,
  LogoutIcon,
  ShieldIcon,
  UserIcon,
  WalletIcon,
} from "../common/Icon";

interface NavItem {
  to: string;
  label: string;
  icon: (size: number) => ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: (s) => <DashboardIcon size={s} /> },
  { to: "/accounts", label: "Accounts", icon: (s) => <WalletIcon size={s} /> },
  { to: "/loans", label: "Loans", icon: (s) => <BankIcon size={s} /> },
  { to: "/credit-score", label: "Credit Score", icon: (s) => <GaugeIcon size={s} /> },
  { to: "/profile", label: "Profile", icon: (s) => <UserIcon size={s} /> },
];

export function SidebarBrand() {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white shadow-sm">
        <BankIcon size={19} />
      </div>
      <span className="text-base font-semibold tracking-tight text-neutral-900">Midnight Bank</span>
    </div>
  );
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();

  return (
    <nav aria-label="Primary" className="flex flex-1 flex-col gap-1">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
              isActive
                ? "bg-primary-50 text-primary-700"
                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            }`
          }
        >
          {item.icon(18)}
          {item.label}
        </NavLink>
      ))}
      {user?.role === "ADMIN" && (
        <NavLink
          to="/admin/audit"
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
              isActive
                ? "bg-primary-50 text-primary-700"
                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            }`
          }
        >
          <ShieldIcon size={18} />
          Admin Audit
        </NavLink>
      )}
    </nav>
  );
}

export function SidebarUserFooter() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
        {user?.username.slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-800">{user?.username}</p>
        <p className="truncate text-xs text-neutral-500">{user?.role}</p>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        aria-label="Log out"
        title="Log out"
        className="shrink-0 rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-700"
      >
        <LogoutIcon size={17} />
      </button>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-neutral-200 bg-white px-4 py-6 lg:flex">
      <div className="mb-8">
        <SidebarBrand />
      </div>
      <SidebarNav />
      <div className="mt-6">
        <SidebarUserFooter />
      </div>
    </aside>
  );
}
