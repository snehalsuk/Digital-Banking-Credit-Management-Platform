import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as accountApi from "../api/accountApi";
import * as transactionApi from "../api/transactionApi";
import type { AccountResponse } from "../types/account";
import type { TransactionResponse } from "../types/transaction";

type FormMode = "deposit" | "withdraw" | "transfer";

export function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const accountId = Number(id);
  const navigate = useNavigate();

  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<TransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
    setSuccess(null);
    const amountValue = Number(amount);
    if (!amountValue || amountValue <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "deposit") {
        await transactionApi.deposit(accountId, { amount: amountValue, description });
        setSuccess("Deposit successful.");
      } else if (mode === "withdraw") {
        await transactionApi.withdraw(accountId, { amount: amountValue, description });
        setSuccess("Withdrawal successful.");
      } else {
        const toId = Number(toAccountId);
        if (!toId) {
          setError("Enter a destination account id.");
          setSubmitting(false);
          return;
        }
        await transactionApi.transfer({ fromAccountId: accountId, toAccountId: toId, amount: amountValue, description });
        setSuccess("Transfer successful.");
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
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p>Loading account...</p>;
  }

  if (!account) {
    return <p>Account not found.</p>;
  }

  return (
    <div className="account-detail-page">
      <h1>Account {account.accountNumber}</h1>
      <p>
        Type: <strong>{account.accountType}</strong> &nbsp; Status:{" "}
        <span className={`status-badge status-${account.status.toLowerCase()}`}>{account.status}</span>
      </p>
      <p className="balance-display">Balance: {account.balance.toFixed(2)}</p>

      <h2>Move money</h2>
      <div className="tab-row">
        <button type="button" className={mode === "deposit" ? "active" : ""} onClick={() => setMode("deposit")}>
          Deposit
        </button>
        <button type="button" className={mode === "withdraw" ? "active" : ""} onClick={() => setMode("withdraw")}>
          Withdraw
        </button>
        <button type="button" className={mode === "transfer" ? "active" : ""} onClick={() => setMode("transfer")}>
          Transfer
        </button>
      </div>

      <form onSubmit={handleSubmit} className="inline-form">
        {mode === "transfer" && (
          <label>
            To account id
            <input value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} required />
          </label>
        )}
        <label>
          Amount
          <input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </label>
        <label>
          Description
          <input value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? "Processing..." : mode === "deposit" ? "Deposit" : mode === "withdraw" ? "Withdraw" : "Transfer"}
        </button>
      </form>
      {error && <p className="form-error">{error}</p>}
      {success && <p className="form-success">{success}</p>}

      <h2>Recent transactions</h2>
      {recentTransactions.length === 0 ? (
        <p>No transactions yet.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Balance after</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {recentTransactions.map((tx) => (
              <tr key={tx.id}>
                <td>{new Date(tx.createdAt).toLocaleString()}</td>
                <td>{tx.type}</td>
                <td>{tx.amount.toFixed(2)}</td>
                <td>{tx.balanceAfter.toFixed(2)}</td>
                <td>{tx.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p>
        <Link to={`/accounts/${accountId}/transactions`}>View full transaction history</Link>
      </p>
      <p>
        <button type="button" onClick={() => navigate("/accounts")}>
          Back to accounts
        </button>
      </p>
    </div>
  );
}
