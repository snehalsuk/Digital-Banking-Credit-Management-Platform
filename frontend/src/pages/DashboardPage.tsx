import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import * as accountApi from "../api/accountApi";
import * as loanApi from "../api/loanApi";
import type { AccountResponse } from "../types/account";
import type { LoanResponse } from "../types/loan";
import { PageHeader } from "../components/common/PageHeader";
import { Card } from "../components/common/Card";
import { Money } from "../components/common/Money";
import { StatusPill } from "../components/common/StatusPill";
import { EmptyState } from "../components/common/EmptyState";
import {
  ArrowUpRightIcon,
  BankIcon,
  GaugeIcon,
  WalletIcon,
} from "../components/common/Icon";

interface Summary {
  totalBalance: number;
  accountCount: number;
  activeLoanCount: number;
  pendingEmiCount: number;
  pendingEmiAmount: number;
}

function StatCard({
  label,
  value,
  icon,
  tone = "primary",
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  tone?: "primary" | "success" | "warning";
}) {
  const toneClasses = {
    primary: "bg-primary-50 text-primary-600",
    success: "bg-success-50 text-success-600",
    warning: "bg-warning-50 text-warning-600",
  }[tone];

  return (
    <Card className="flex items-center gap-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${toneClasses}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-neutral-500">{label}</p>
        <div className="mt-0.5 truncate">{value}</div>
      </div>
    </Card>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [loans, setLoans] = useState<LoanResponse[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [accountsData, loansData] = await Promise.all([
          accountApi.getMyAccounts().catch(() => []),
          loanApi.getLoans().catch(() => []),
        ]);
        if (cancelled) return;
        setAccounts(accountsData);
        setLoans(loansData);

        const activeLoans = loansData.filter((l) => l.status === "ACTIVE");
        const schedules = await Promise.all(
          activeLoans.map((l) => loanApi.getEmiSchedule(l.id).catch(() => []))
        );
        if (cancelled) return;

        // Only count EMIs that are actually overdue (missed), not ones simply
        // not yet due — this mirrors the credit-score lookup's definition of
        // "pending EMIs" (backend's findOverdueByCustomerId), so the number
        // shown here means the same thing everywhere in the app.
        let pendingEmiCount = 0;
        let pendingEmiAmount = 0;
        for (const schedule of schedules) {
          for (const emi of schedule) {
            if (emi.status === "OVERDUE" || emi.status === "DEFAULTED") {
              pendingEmiCount += 1;
              pendingEmiAmount += emi.emiAmount - emi.paidAmount;
            }
          }
        }

        setSummary({
          totalBalance: accountsData.reduce((sum, a) => sum + a.balance, 0),
          accountCount: accountsData.length,
          activeLoanCount: activeLoans.length,
          pendingEmiCount,
          pendingEmiAmount,
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <PageHeader
        title={`Welcome${user ? `, ${user.username}` : ""}`}
        description="Here's a snapshot of your accounts, loans, and upcoming payments."
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <div className="h-11 animate-pulse rounded-xl bg-neutral-100" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total balance"
            value={<Money amount={summary?.totalBalance ?? 0} size="lg" />}
            icon={<WalletIcon size={20} />}
          />
          <StatCard label="Accounts" value={<span className="text-2xl font-bold text-neutral-900">{summary?.accountCount ?? 0}</span>} icon={<WalletIcon size={20} />} />
          <StatCard
            label="Active loans"
            value={<span className="text-2xl font-bold text-neutral-900">{summary?.activeLoanCount ?? 0}</span>}
            icon={<BankIcon size={20} />}
            tone="success"
          />
          <StatCard
            label="Overdue EMIs"
            value={
              <span className="text-2xl font-bold text-neutral-900">
                {summary?.pendingEmiCount ?? 0}
                {summary && summary.pendingEmiCount > 0 && (
                  <span className="ml-1.5 text-sm font-medium text-neutral-500 tabular-nums">
                    (<Money amount={summary.pendingEmiAmount} size="sm" className="text-neutral-500" />)
                  </span>
                )}
              </span>
            }
            icon={<GaugeIcon size={20} />}
            tone="warning"
          />
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-neutral-900">Your accounts</h2>
            <Link to="/accounts" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          {!loading && accounts.length === 0 ? (
            <EmptyState
              icon={<WalletIcon size={22} />}
              title="No accounts yet"
              description="Open your first savings or current account to get started."
              action={
                <Link to="/accounts" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                  Open an account &rarr;
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-neutral-100">
              {accounts.slice(0, 4).map((account) => (
                <li key={account.id} className="flex items-center justify-between py-3">
                  <div>
                    <Link to={`/accounts/${account.id}`} className="text-sm font-medium text-neutral-800 hover:text-primary-600">
                      {account.accountNumber}
                    </Link>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-neutral-500">{account.accountType}</span>
                      <StatusPill status={account.status} />
                    </div>
                  </div>
                  <Money amount={account.balance} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-neutral-900">Your loans</h2>
            <Link to="/loans" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          {!loading && loans.length === 0 ? (
            <EmptyState
              icon={<BankIcon size={22} />}
              title="No loans yet"
              description="Apply for a personal, home, or auto loan whenever you're ready."
              action={
                <Link to="/loans" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                  Apply for a loan &rarr;
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-neutral-100">
              {loans.slice(0, 4).map((loan) => (
                <li key={loan.id} className="flex items-center justify-between py-3">
                  <div>
                    <Link to={`/loans/${loan.id}`} className="text-sm font-medium text-neutral-800 hover:text-primary-600">
                      {loan.loanType} loan #{loan.id}
                    </Link>
                    <div className="mt-1">
                      <StatusPill status={loan.status} />
                    </div>
                  </div>
                  <Money amount={loan.principal} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <QuickLink to="/accounts" label="Manage accounts" icon={<WalletIcon size={18} />} />
        <QuickLink to="/loans" label="View loans" icon={<BankIcon size={18} />} />
        <QuickLink to="/credit-score" label="Check credit score" icon={<GaugeIcon size={18} />} />
      </div>
    </div>
  );
}

function QuickLink({ to, label, icon }: { to: string; label: string; icon: ReactNode }) {
  return (
    <Link
      to={to}
      className="group flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3.5 shadow-[var(--shadow-card)] transition-colors hover:border-primary-300 hover:bg-primary-50/40"
    >
      <span className="flex items-center gap-2.5 text-sm font-medium text-neutral-700 group-hover:text-primary-700">
        {icon}
        {label}
      </span>
      <ArrowUpRightIcon size={16} className="text-neutral-400 group-hover:text-primary-600" />
    </Link>
  );
}
