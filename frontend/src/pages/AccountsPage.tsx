import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import * as accountApi from "../api/accountApi";
import type { AccountResponse, AccountType } from "../types/account";

export function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<AccountType>("SAVINGS");
  const [opening, setOpening] = useState(false);

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
      loadAccounts();
    } catch {
      setError("Could not open account. Make sure your KYC profile is complete.");
    } finally {
      setOpening(false);
    }
  }

  return (
    <div className="accounts-page">
      <h1>Your Accounts</h1>

      {loading ? (
        <p>Loading accounts...</p>
      ) : accounts.length === 0 ? (
        <p>You have no accounts yet.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Account number</th>
              <th>Type</th>
              <th>Balance</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id}>
                <td>{account.accountNumber}</td>
                <td>{account.accountType}</td>
                <td>{account.balance.toFixed(2)}</td>
                <td>
                  <span className={`status-badge status-${account.status.toLowerCase()}`}>{account.status}</span>
                </td>
                <td>
                  <Link to={`/accounts/${account.id}`}>View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Open a new account</h2>
      <form onSubmit={handleOpenAccount} className="inline-form">
        <label>
          Account type
          <select value={accountType} onChange={(e) => setAccountType(e.target.value as AccountType)}>
            <option value="SAVINGS">Savings</option>
            <option value="CURRENT">Current</option>
          </select>
        </label>
        <button type="submit" disabled={opening}>
          {opening ? "Opening..." : "Open account"}
        </button>
      </form>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
