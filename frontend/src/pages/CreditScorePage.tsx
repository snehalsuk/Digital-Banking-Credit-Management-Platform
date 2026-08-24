import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthContext";
import * as creditScoreApi from "../api/creditScoreApi";
import * as customerApi from "../api/customerApi";
import { ScoreGauge } from "../components/common/ScoreGauge";
import type { CreditScoreLookupResponse } from "../types/creditScore";

const OFFICER_PURPOSES = ["Loan underwriting", "KYC verification", "Periodic review"];

export function CreditScorePage() {
  const { user } = useAuth();
  const isCustomer = user?.role === "CUSTOMER";
  const isOfficerOrAdmin = user?.role === "LOAN_OFFICER" || user?.role === "ADMIN";

  const [pan, setPan] = useState("");
  const [panLoading, setPanLoading] = useState(isCustomer);
  const [purpose, setPurpose] = useState(OFFICER_PURPOSES[0]);
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [result, setResult] = useState<CreditScoreLookupResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Customers look up only their own PAN — pre-fill and lock it from their KYC profile.
  useEffect(() => {
    if (!isCustomer) return;
    let cancelled = false;
    customerApi
      .getMyProfile()
      .then((profile) => {
        if (!cancelled) setPan(profile.pan);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your PAN. Complete your KYC profile first.");
      })
      .finally(() => {
        if (!cancelled) setPanLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isCustomer]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (!consentConfirmed) {
      setError("You must confirm consent before running a credit score lookup.");
      return;
    }

    setLoading(true);
    try {
      const response = await creditScoreApi.lookupCreditScore({
        pan,
        consentConfirmed,
        purpose: isCustomer ? "Self credit check" : purpose,
      });
      setResult(response);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (status === 404) {
        setError("No customer found for the given PAN.");
      } else if (status === 403) {
        setError("You are not authorized to look up this PAN.");
      } else if (message?.toLowerCase().includes("consent")) {
        setError("Consent must be confirmed before a credit bureau lookup can proceed.");
      } else {
        setError(message ?? "Could not complete the credit score lookup.");
      }
    } finally {
      setLoading(false);
    }
  }

  const delinquentTradeLines = result?.tradeLines.filter((t) => t.daysPastDue > 0) ?? [];

  return (
    <div className="credit-score-page">
      <h1>Credit Score Lookup</h1>

      <form onSubmit={handleSubmit} className="inline-form">
        <label>
          PAN
          <input
            value={pan}
            onChange={(e) => setPan(e.target.value.toUpperCase())}
            disabled={isCustomer}
            pattern="^[A-Z]{5}[0-9]{4}[A-Z]$"
            maxLength={10}
            placeholder="AAAAA9999A"
            required
          />
        </label>

        {isOfficerOrAdmin && (
          <label>
            Purpose
            <select value={purpose} onChange={(e) => setPurpose(e.target.value)}>
              {OFFICER_PURPOSES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={consentConfirmed}
            onChange={(e) => setConsentConfirmed(e.target.checked)}
            required
          />
          {isCustomer
            ? "I consent to my credit score and EMI history being checked."
            : "I confirm consent has been obtained from the customer for this bureau lookup."}
        </label>

        <button type="submit" disabled={loading || panLoading || !pan}>
          {loading ? "Checking..." : isCustomer ? "Check My Credit Score" : "Look Up Credit Score"}
        </button>
      </form>

      {error && <p className="form-error">{error}</p>}

      {result && (
        <div className="credit-score-results">
          {result.dataSource === "MOCK" && (
            <p className="mock-bureau-banner">
              ⚠ MOCK BUREAU DATA — this is simulated for development. Real bureau integration requires a business
              agreement with a credit bureau.
            </p>
          )}

          <ScoreGauge score={result.combinedScore} band={result.scoreBand} />

          <table className="data-table">
            <thead>
              <tr>
                <th>Bureau score</th>
                <th>Internal score</th>
                <th>Combined score</th>
                <th>Band</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{result.bureauScore}</td>
                <td>{result.internalScore}</td>
                <td>
                  <strong>{result.combinedScore}</strong>
                </td>
                <td>{result.scoreBand}</td>
              </tr>
            </tbody>
          </table>

          <h2>Pending / Overdue EMIs</h2>
          {result.pendingEmis.length === 0 ? (
            <p>No pending or overdue EMIs on the bank's own book.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Loan ID</th>
                  <th>Installment #</th>
                  <th>Amount</th>
                  <th>Due date</th>
                  <th>Days overdue</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {result.pendingEmis.map((emi) => (
                  <tr key={`${emi.loanId}-${emi.installmentNumber}`}>
                    <td>{emi.loanId}</td>
                    <td>{emi.installmentNumber}</td>
                    <td>{emi.emiAmount.toFixed(2)}</td>
                    <td>{emi.dueDate}</td>
                    <td>{emi.daysOverdue}</td>
                    <td>
                      <span className={`status-badge emi-status-${emi.status.toLowerCase()}`}>{emi.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {delinquentTradeLines.length > 0 && (
            <>
              <h2>Bureau-reported delinquencies</h2>
              <p>
                <small>As reported by credit bureau</small>
              </p>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Lender</th>
                    <th>Account type</th>
                    <th>Sanctioned</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th>Days past due</th>
                  </tr>
                </thead>
                <tbody>
                  {delinquentTradeLines.map((t, idx) => (
                    <tr key={`${t.lenderName}-${idx}`}>
                      <td>{t.lenderName}</td>
                      <td>{t.accountType}</td>
                      <td>{t.sanctionedAmount.toFixed(2)}</td>
                      <td>{t.currentBalance.toFixed(2)}</td>
                      <td>{t.accountStatus}</td>
                      <td>{t.daysPastDue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          <p>
            <small>Last updated: {new Date(result.lastUpdated).toLocaleString()}</small>
          </p>
        </div>
      )}
    </div>
  );
}
