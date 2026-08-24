import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import * as accountApi from "../api/accountApi";
import type { AccountResponse, AccountType } from "../types/account";
import { PageHeader } from "../components/common/PageHeader";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Select } from "../components/common/FormField";
import { StatusPill } from "../components/common/StatusPill";
import { Money } from "../components/common/Money";
import { EmptyState } from "../components/common/EmptyState";
import { Table, THead, Th, TBody, Tr, Td, TableSkeleton } from "../components/common/Table";
import { ChevronIcon, PlusIcon, WalletIcon } from "../components/common/Icon";
import { useToast } from "../components/common/ToastContext";

export function AccountsPage() {
  const toast = useToast();
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<AccountType>("SAVINGS");
  const [opening, setOpening] = useState(false);
  const [showForm, setShowForm] = useState(false);

  function loadAccounts() {
    setLoading(true);
    accountApi
      .getMyAccounts()
      .then(setAccounts)
      .catch(() => setError("Could not load accounts."))
      .finally(() => setLoading(false));
  }

  useEffect(loadAccounts, []);

  async function handleOpenAccount(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setOpening(true);
    try {
      await accountApi.openAccount({ accountType });
      toast.success(`${accountType === "SAVINGS" ? "Savings" : "Current"} account opened.`);
      setShowForm(false);
      loadAccounts();
    } catch {
      setError("Could not open account. Make sure your KYC profile is complete.");
      toast.error("Could not open account. Make sure your KYC profile is complete.");
    } finally {
      setOpening(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Your Accounts"
        description="View balances and open new savings or current accounts."
        action={
          <Button icon={<PlusIcon size={16} />} onClick={() => setShowForm((v) => !v)}>
            Open account
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleOpenAccount} className="flex flex-col items-end gap-4 sm:flex-row">
            <Select
              label="Account type"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as AccountType)}
              wrapperClassName="w-full sm:w-56"
            >
              <option value="SAVINGS">Savings</option>
              <option value="CURRENT">Current</option>
            </Select>
            <Button type="submit" loading={opening}>
              Confirm
            </Button>
          </form>
          {error && <p className="mt-3 text-sm font-medium text-danger-600">{error}</p>}
        </Card>
      )}

      <Card padded={false}>
        {loading ? (
          <Table>
            <THead>
              <Th>Account number</Th>
              <Th>Type</Th>
              <Th>Balance</Th>
              <Th>Status</Th>
              <Th />
            </THead>
            <TableSkeleton cols={5} />
          </Table>
        ) : accounts.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<WalletIcon size={22} />}
              title="You have no accounts yet"
              description="Open your first account to start banking with Midnight Bank."
              action={
                <Button size="sm" icon={<PlusIcon size={14} />} onClick={() => setShowForm(true)}>
                  Open account
                </Button>
              }
            />
          </div>
        ) : (
          <Table>
            <THead>
              <Th>Account number</Th>
              <Th>Type</Th>
              <Th className="text-right">Balance</Th>
              <Th>Status</Th>
              <Th />
            </THead>
            <TBody>
              {accounts.map((account) => (
                <Tr key={account.id}>
                  <Td className="font-mono tracking-wide text-neutral-800">{account.accountNumber}</Td>
                  <Td>{account.accountType === "SAVINGS" ? "Savings" : "Current"}</Td>
                  <Td className="text-right">
                    <Money amount={account.balance} />
                  </Td>
                  <Td>
                    <StatusPill status={account.status} />
                  </Td>
                  <Td className="text-right">
                    <Link
                      to={`/accounts/${account.id}`}
                      className="inline-flex items-center gap-0.5 text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                      View <ChevronIcon size={14} />
                    </Link>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
