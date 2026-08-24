import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as accountApi from "../api/accountApi";
import * as transactionApi from "../api/transactionApi";
import type { AccountResponse } from "../types/account";
import type { TransactionResponse, TransactionType } from "../types/transaction";
import { PageHeader } from "../components/common/PageHeader";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/FormField";
import { StatusPill } from "../components/common/StatusPill";
import { Money } from "../components/common/Money";
import { EmptyState } from "../components/common/EmptyState";
import {
  AlertIcon,
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  ChevronIcon,
  TransferIcon,
} from "../components/common/Icon";
import { useToast } from "../components/common/ToastContext";

type FormMode = "deposit" | "withdraw" | "transfer";

const MODE_TABS: { key: FormMode; label: string }[] = [
  { key: "deposit", label: "Deposit" },
  { key: "withdraw", label: "Withdraw" },
  { key: "transfer", label: "Transfer" },
];

function txIcon(type: TransactionType) {
  if (type === "DEPOSIT" || type === "TRANSFER_IN") {
    return <ArrowDownRightIcon size={15} className="text-success-600" />;
  }
  return <ArrowUpRightIcon size={15} className="text-danger-600" />;
}

function txSign(type: TransactionType): "positive" | "negative" {
  return type === "DEPOSIT" || type === "TRANSFER_IN" ? "positive" : "negative";
}

function txLabel(type: TransactionType): string {
  switch (type) {
    case "DEPOSIT":
      return "Deposit";
    case "WITHDRAWAL":
      return "Withdrawal";
    case "TRANSFER_IN":
      return "Transfer in";
    case "TRANSFER_OUT":
      return "Transfer out";
  }
}

export function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const accountId = Number(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<TransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<FormMode>("deposit");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function loadAccount() {
    if (!Number.isFinite(accountId)) return;
    setLoading(true);
    Promise.all([accountApi.getAccount(accountId), transactionApi.getTransactions(accountId, 0, 5)])
      .then(([accountData, txPage]) => {
        setAccount(accountData);
        setRecentTransactions(txPage.content);
      })
      .catch(() => setError("Could not load account."))
      .finally(() => setLoading(false));
  }

  useEffect(loadAccount, [accountId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const amountValue = Number(amount);
    if (!amountValue || amountValue <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "deposit") {
        await transactionApi.deposit(accountId, { amount: amountValue, description });
        toast.success("Deposit successful.");
      } else if (mode === "withdraw") {
        await transactionApi.withdraw(accountId, { amount: amountValue, description });
        toast.success("Withdrawal successful.");
      } else {
        const toId = Number(toAccountId);
        if (!toId) {
          setError("Enter a destination account id.");
          setSubmitting(false);
          return;
        }
        await transactionApi.transfer({ fromAccountId: accountId, toAccountId: toId, amount: amountValue, description });
        toast.success("Transfer successful.");
      }
      setAmount("");
      setDescription("");
      setToAccountId("");
      loadAccount();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Transaction failed. Check the amount and account status.";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Account" />
        <Card>
          <div className="h-24 animate-pulse rounded-xl bg-neutral-100" />
        </Card>
      </div>
    );
  }

  if (!account) {
    return (
      <EmptyState
        icon={<AlertIcon size={22} />}
        title="Account not found"
        description="This account may not exist or you may not have access to it."
        action={
          <Button size="sm" onClick={() => navigate("/accounts")}>
            Back to accounts
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Account ${account.accountNumber}`}
        description={
          <span className="flex items-center gap-2">
            {account.accountType === "SAVINGS" ? "Savings account" : "Current account"}
            <StatusPill status={account.status} />
          </span>
        }
      />

      <Card className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <p className="text-sm font-medium text-primary-100">Available balance</p>
        <div className="mt-1">
          <Money amount={account.balance} className="text-white" size="xl" />
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-neutral-900">Move money</h2>
        <div className="mb-5 inline-flex rounded-lg border border-neutral-200 bg-neutral-100 p-1">
          {MODE_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setMode(tab.key);
                setError(null);
              }}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                mode === tab.key ? "bg-white text-primary-700 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {mode === "transfer" && (
            <Input
              label="To account ID"
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              required
              startAdornment={<TransferIcon size={15} />}
            />
          )}
          <Input
            label="Amount"
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            startAdornment={<span className="text-sm">&#8377;</span>}
          />
          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            wrapperClassName={mode === "transfer" ? "sm:col-span-2 lg:col-span-1" : "sm:col-span-1"}
          />
          <div className="flex items-end">
            <Button type="submit" loading={submitting} fullWidth>
              {mode === "deposit" ? "Deposit" : mode === "withdraw" ? "Withdraw" : "Transfer"}
            </Button>
          </div>
        </form>
        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-danger-50 px-3.5 py-2.5 text-sm text-danger-700">
            <AlertIcon size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </Card>

      <Card padded={false}>
        <div className="flex items-center justify-between px-5 pt-5 sm:px-6 sm:pt-6">
          <h2 className="text-base font-semibold text-neutral-900">Recent transactions</h2>
          <Link
            to={`/accounts/${accountId}/transactions`}
            className="inline-flex items-center gap-0.5 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            View all <ChevronIcon size={14} />
          </Link>
        </div>
        <div className="p-5 sm:p-6">
          {recentTransactions.length === 0 ? (
            <EmptyState title="No transactions yet" description="Deposits, withdrawals, and transfers will show up here." />
          ) : (
            <ul className="divide-y divide-neutral-100">
              {recentTransactions.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                      {txIcon(tx.type)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-800">{txLabel(tx.type)}</p>
                      <p className="truncate text-xs text-neutral-500">
                        {tx.description || new Date(tx.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Money amount={tx.amount} sign={txSign(tx.type)} prefix={txSign(tx.type) === "positive" ? "+" : "-"} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}
