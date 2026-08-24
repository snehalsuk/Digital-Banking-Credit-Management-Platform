import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import * as loanApi from "../api/loanApi";
import { useAuth } from "../auth/AuthContext";
import type { LoanResponse } from "../types/loan";

const emptyForm = {
  accountId: "",
  loanType: "PERSONAL",
  principal: "",
  interestRateAnnual: "",
  tenureMonths: "",
};

export function LoansPage() {
  const { user } = useAuth();
  const isOfficerOrAdmin = user?.role === "LOAN_OFFICER" || user?.role === "ADMIN";

  const [loans, setLoans] = useState<LoanResponse[]>([]);
  const [pendingLoans, setPendingLoans] = useState<LoanResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [applying, setApplying] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  function loadLoans() {
    setLoading(true);
    const requests = [loanApi.getLoans()];
    if (isOfficerOrAdmin) {
      requests.push(loanApi.getLoans({ status: "PENDING" }));
    }
    Promise.all(requests)
      .then(([all, pending]) => {
        setLoans(all);
        setPendingLoans(pending ?? []);
      })
      .catch(() => setError("Could not load loans."))
      .finally(() => setLoading(false));
  }

  useEffect(loadLoans, [isOfficerOrAdmin]);

  async function handleApply(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setApplying(true);
    try {
      await loanApi.applyForLoan({
        accountId: Number(form.accountId),
        loanType: form.loanType,
        principal: Number(form.principal),
        interestRateAnnual: Number(form.interestRateAnnual),
        tenureMonths: Number(form.tenureMonths),
      });
      setForm(emptyForm);
      loadLoans();
    } catch {
      setError("Could not submit loan application. Check that the account id belongs to you.");
    } finally {
      setApplying(false);
    }
  }

  async function handleApprove(loanId: number) {
    setApprovingId(loanId);
    setError(null);
    try {
      await loanApi.approveLoan(loanId);
      loadLoans();
    } catch {
      setError("Could not approve loan.");
    } finally {
      setApprovingId(null);
    }
  }

  return (
    <div className="loans-page">
      <h1>Loans</h1>

      {isOfficerOrAdmin && (
        <>
          <h2>Pending approval</h2>
          {pendingLoans.length === 0 ? (
            <p>No loans awaiting approval.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Loan</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Principal</th>
                  <th>Rate</th>
                  <th>Tenure</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pendingLoans.map((loan) => (
                  <tr key={loan.id}>
                    <td>{loan.id}</td>
                    <td>{loan.customerId}</td>
                    <td>{loan.loanType}</td>
                    <td>{loan.principal.toFixed(2)}</td>
                    <td>{loan.interestRateAnnual}%</td>
                    <td>{loan.tenureMonths} mo</td>
                    <td>
                      <button type="button" disabled={approvingId === loan.id} onClick={() => handleApprove(loan.id)}>
                        {approvingId === loan.id ? "Approving..." : "Approve & disburse"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      <h2>{isOfficerOrAdmin ? "All loans" : "Your loans"}</h2>
      {loading ? (
        <p>Loading...</p>
      ) : loans.length === 0 ? (
        <p>No loans yet.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Loan</th>
              <th>Type</th>
              <th>Principal</th>
              <th>EMI</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loans.map((loan) => (
              <tr key={loan.id}>
                <td>{loan.id}</td>
                <td>{loan.loanType}</td>
                <td>{loan.principal.toFixed(2)}</td>
                <td>{loan.emiAmount.toFixed(2)}</td>
                <td>
                  <span className={`status-badge status-${loan.status.toLowerCase()}`}>{loan.status}</span>
                </td>
                <td>
                  <Link to={`/loans/${loan.id}`}>View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!isOfficerOrAdmin && (
        <>
          <h2>Apply for a loan</h2>
          <form onSubmit={handleApply} className="inline-form">
            <label>
              Account id
              <input value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} required />
            </label>
            <label>
              Loan type
              <select value={form.loanType} onChange={(e) => setForm({ ...form, loanType: e.target.value })}>
                <option value="PERSONAL">Personal</option>
                <option value="HOME">Home</option>
                <option value="AUTO">Auto</option>
              </select>
            </label>
            <label>
              Principal
              <input
                type="number"
                step="0.01"
                min="1"
                value={form.principal}
                onChange={(e) => setForm({ ...form, principal: e.target.value })}
                required
              />
            </label>
            <label>
              Annual interest rate (%)
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="99.99"
                value={form.interestRateAnnual}
                onChange={(e) => setForm({ ...form, interestRateAnnual: e.target.value })}
                required
              />
            </label>
            <label>
              Tenure (months)
              <input
                type="number"
                min="1"
                max="480"
                value={form.tenureMonths}
                onChange={(e) => setForm({ ...form, tenureMonths: e.target.value })}
                required
              />
            </label>
            <button type="submit" disabled={applying}>
              {applying ? "Submitting..." : "Apply"}
            </button>
          </form>
        </>
      )}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
