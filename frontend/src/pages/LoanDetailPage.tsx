import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import * as loanApi from "../api/loanApi";
import type { EmiScheduleResponse, LoanResponse } from "../types/loan";

export function LoanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const loanId = Number(id);

  const [loan, setLoan] = useState<LoanResponse | null>(null);
  const [schedule, setSchedule] = useState<EmiScheduleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [paying, setPaying] = useState(false);

  function loadLoan() {
    if (!Number.isFinite(loanId)) return;
    setLoading(true);
    Promise.all([loanApi.getLoan(loanId), loanApi.getEmiSchedule(loanId)])
      .then(([loanData, scheduleData]) => {
        setLoan(loanData);
        setSchedule(scheduleData);
      })
      .catch(() => setError("Could not load loan."))
      .finally(() => setLoading(false));
  }

  useEffect(loadLoan, [loanId]);

  const nextUnpaid = schedule.find((installment) => installment.status !== "PAID");

  useEffect(() => {
    if (nextUnpaid) {
      setPayAmount(String(nextUnpaid.emiAmount));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextUnpaid?.installmentNumber]);

  async function handlePay(event: FormEvent) {
    event.preventDefault();
    if (!nextUnpaid) return;
    setError(null);
    setPaying(true);
    try {
      await loanApi.payEmi(loanId, nextUnpaid.installmentNumber, { amount: Number(payAmount) });
      loadLoan();
    } catch {
      setError("Could not process EMI payment. Check the linked account balance.");
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return <p>Loading loan...</p>;
  }

  if (!loan) {
    return <p>Loan not found.</p>;
  }

  return (
    <div className="loan-detail-page">
      <h1>Loan #{loan.id}</h1>
      <p>
        Type: <strong>{loan.loanType}</strong> &nbsp; Status:{" "}
        <span className={`status-badge status-${loan.status.toLowerCase()}`}>{loan.status}</span>
      </p>
      <p>
        Principal: {loan.principal.toFixed(2)} &nbsp; Rate: {loan.interestRateAnnual}% &nbsp; Tenure:{" "}
        {loan.tenureMonths} months &nbsp; EMI: {loan.emiAmount.toFixed(2)}
      </p>
      {loan.disbursedDate && <p>Disbursed on {loan.disbursedDate}</p>}

      {loan.status === "PENDING" && <p>Awaiting officer/admin approval before an EMI schedule is generated.</p>}

      {schedule.length > 0 && (
        <>
          <h2>EMI Schedule</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Due date</th>
                <th>Principal</th>
                <th>Interest</th>
                <th>EMI</th>
                <th>Paid</th>
                <th>Status</th>
                <th>Days overdue</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((installment) => (
                <tr key={installment.id}>
                  <td>{installment.installmentNumber}</td>
                  <td>{installment.dueDate}</td>
                  <td>{installment.principalComponent.toFixed(2)}</td>
                  <td>{installment.interestComponent.toFixed(2)}</td>
                  <td>{installment.emiAmount.toFixed(2)}</td>
                  <td>{installment.paidAmount.toFixed(2)}</td>
                  <td>
                    <span className={`status-badge emi-status-${installment.status.toLowerCase()}`}>
                      {installment.status}
                    </span>
                  </td>
                  <td>{installment.daysOverdue > 0 ? installment.daysOverdue : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {nextUnpaid && (
            <>
              <h2>Pay next installment (#{nextUnpaid.installmentNumber})</h2>
              <form onSubmit={handlePay} className="inline-form">
                <label>
                  Amount
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    required
                  />
                </label>
                <button type="submit" disabled={paying}>
                  {paying ? "Paying..." : "Pay EMI"}
                </button>
              </form>
            </>
          )}
        </>
      )}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
